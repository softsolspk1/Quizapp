const express = require('express');
const prisma = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// Helper function to get random questions
async function getRandomQuestions(categoryId, count, difficulty = 'medium') {
  const whereClause = { categoryId, isActive: true };
  if (difficulty && difficulty !== 'all') {
    whereClause.difficulty = difficulty;
  }

  // Get all active question IDs for the category
  let allQuestions = await prisma.question.findMany({
    where: whereClause,
    select: { id: true, question: true, options: true, difficulty: true, correctAnswer: true }
  });

  if (allQuestions.length === 0 && difficulty && difficulty !== 'all') {
    // Fallback to any difficulty if no questions found matching selection
    allQuestions = await prisma.question.findMany({
      where: { categoryId, isActive: true },
      select: { id: true, question: true, options: true, difficulty: true, correctAnswer: true }
    });
  }

  if (allQuestions.length === 0) return [];

  // Shuffle array
  const shuffled = allQuestions.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Start new quiz session
router.post('/start', auth, async (req, res) => {
  try {
    const { categoryId, gameMode = 'single', difficulty = 'medium' } = req.body;
    const catId = parseInt(categoryId);
    const totalQuestions = 10; // Forced to 10 as per user request

    const questions = await getRandomQuestions(catId, totalQuestions, difficulty);

    if (questions.length === 0) {
      return res.status(400).json({ message: 'No questions available in this category' });
    }

    // Create quiz session
    const quizSession = await prisma.quizSession.create({
      data: {
        userId: req.user.id,
        categoryId: catId,
        totalQuestions: questions.length,
        gameMode,
        questions: {
          create: questions.map(q => ({
            questionId: q.id
          }))
        }
      }
    });

    // Return questions without correct answers
    const questionsForUser = questions.map(q => ({
      id: q.id,
      question: q.question,
      options: q.options,
      difficulty: q.difficulty
    }));

    res.json({
      sessionId: quizSession.id,
      questions: questionsForUser,
      totalQuestions: questions.length
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Submit quiz answers
router.post('/submit', auth, async (req, res) => {
  try {
    const { sessionId, answers } = req.body;
    const id = parseInt(sessionId);

    const quizSession = await prisma.quizSession.findUnique({
      where: { id },
      include: {
        questions: { include: { question: true } },
        category: { select: { name: true } }
      }
    });

    if (!quizSession) {
      return res.status(404).json({ message: 'Quiz session not found' });
    }

    if (quizSession.userId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (quizSession.isCompleted) {
      return res.status(400).json({ message: 'Quiz already completed' });
    }

    let score = 0;
    let correctAnswers = 0;
    let wrongAnswers = 0;
    const pointMultiplier = quizSession.gameMode === 'multiplayer' ? 2 : 1;

    let timeSpentTotal = 0;

    // Process each answer
    for (let i = 0; i < quizSession.questions.length; i++) {
      const sessionQuestion = quizSession.questions[i];
      const userAnswer = answers[i] || {};
      
      const timeSpent = userAnswer.timeSpent || 0;
      timeSpentTotal += timeSpent;

      let isCorrect = false;
      if (sessionQuestion.question && userAnswer.answer === sessionQuestion.question.correctAnswer) {
        isCorrect = true;
      }

      if (isCorrect) {
        correctAnswers++;
        const diff = sessionQuestion.question?.difficulty || 'medium';
        if (diff === 'easy') {
          score += 2;
        } else if (diff === 'hard') {
          score += 5;
        } else {
          score += 3;
        }
      } else {
        wrongAnswers++;
        score -= 1; // Wrong answer gives -1
      }

      // Update Session Question
      await prisma.quizSessionQuestion.update({
        where: { id: sessionQuestion.id },
        data: {
          userAnswer: userAnswer.answer,
          timeSpent,
          isCorrect
        }
      });

      // Update question statistics
      if (sessionQuestion.question) {
        await prisma.question.update({
          where: { id: sessionQuestion.question.id },
          data: {
            timesAnswered: { increment: 1 },
            correctCount: { increment: isCorrect ? 1 : 0 }
          }
        });
      }
    }

    const finalScore = Math.max(0, score);

    // Update quiz session
    await prisma.quizSession.update({
      where: { id: quizSession.id },
      data: {
        score: finalScore,
        correctAnswers,
        wrongAnswers,
        timeSpent: timeSpentTotal,
        isCompleted: true,
        completedAt: new Date()
      }
    });

    // Update user statistics & gamification
    const userToUpdate = await prisma.user.findUnique({ where: { id: req.user.id } });
    const newTotalPoints = userToUpdate.totalPoints + finalScore;
    
    let newLevel = 1;
    let newBadges = [...userToUpdate.badges];

    if (newTotalPoints >= 5000) newLevel = 5;
    else if (newTotalPoints >= 2000) newLevel = 4;
    else if (newTotalPoints >= 1000) newLevel = 3;
    else if (newTotalPoints >= 500) newLevel = 2;

    const badgesByLevel = {
      2: 'Novice',
      3: 'Apprentice',
      4: 'Expert',
      5: 'Master'
    };

    if (badgesByLevel[newLevel] && !newBadges.includes(badgesByLevel[newLevel])) {
      newBadges.push(badgesByLevel[newLevel]);
    }

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        totalPoints: newTotalPoints,
        gamesPlayed: userToUpdate.gamesPlayed + 1,
        correctAnswers: userToUpdate.correctAnswers + correctAnswers,
        wrongAnswers: userToUpdate.wrongAnswers + wrongAnswers,
        level: newLevel,
        badges: newBadges
      }
    });

    // Handle Competition Enrollment Score
    const competitionId = req.body.competitionId;
    if (competitionId) {
      const enrollment = await prisma.competitionEnrollment.findUnique({
        where: {
          userId_competitionId: {
            userId: req.user.id,
            competitionId: parseInt(competitionId)
          }
        }
      });
      if (enrollment && enrollment.score === null) {
        await prisma.competitionEnrollment.update({
          where: { id: enrollment.id },
          data: {
            score: finalScore,
            timeSpent: timeSpentTotal,
            completedAt: new Date()
          }
        });
      }
    }

    res.json({
      score: finalScore,
      correctAnswers,
      wrongAnswers,
      totalQuestions: quizSession.totalQuestions,
      timeSpent: timeSpentTotal,
      gameMode: quizSession.gameMode,
      category: quizSession.category.name
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Get user's quiz history
router.get('/history', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const [sessions, total] = await Promise.all([
      prisma.quizSession.findMany({
        where: { userId: req.user.id, isCompleted: true },
        include: { category: { select: { name: true } } },
        orderBy: { completedAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit
      }),
      prisma.quizSession.count({
        where: { userId: req.user.id, isCompleted: true }
      })
    ]);

    res.json({
      sessions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Get quiz session details
router.get('/session/:id', auth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const quizSession = await prisma.quizSession.findUnique({
      where: { id },
      include: {
        questions: { include: { question: true } },
        category: { select: { name: true } }
      }
    });

    if (!quizSession) {
      return res.status(404).json({ message: 'Quiz session not found' });
    }

    if (quizSession.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(quizSession);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Create multiplayer room
router.post('/multiplayer/create-room', auth, async (req, res) => {
  try {
    const { categoryId } = req.body;
    const catId = parseInt(categoryId);
    const totalQuestions = 10; // Forced to 10
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const questions = await getRandomQuestions(catId, totalQuestions);

    if (questions.length === 0) {
      return res.status(400).json({ message: 'No questions available in this category' });
    }

    const quizSession = await prisma.quizSession.create({
      data: {
        userId: req.user.id,
        categoryId: catId,
        totalQuestions: questions.length,
        gameMode: 'multiplayer',
        roomId,
        questions: {
          create: questions.map(q => ({
            questionId: q.id
          }))
        }
      }
    });

    res.json({
      roomId,
      sessionId: quizSession.id,
      totalQuestions: questions.length
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Join multiplayer room
router.post('/multiplayer/join-room', auth, async (req, res) => {
  try {
    const { roomId } = req.body;

    // Find existing room
    const existingSession = await prisma.quizSession.findFirst({
      where: { roomId, gameMode: 'multiplayer' },
      include: { questions: true }
    });

    if (!existingSession) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Create new session for joining user with same questions
    const quizSession = await prisma.quizSession.create({
      data: {
        userId: req.user.id,
        categoryId: existingSession.categoryId,
        totalQuestions: existingSession.totalQuestions,
        gameMode: 'multiplayer',
        roomId,
        questions: {
          create: existingSession.questions.map(q => ({
            questionId: q.questionId
          }))
        }
      }
    });

    res.json({
      roomId,
      sessionId: quizSession.id,
      totalQuestions: quizSession.totalQuestions
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Join PIN quiz
router.post('/pin/join', auth, async (req, res) => {
  try {
    const { code } = req.body;

    const pin = await prisma.pin.findUnique({ where: { code } });
    if (!pin || !pin.isActive) {
      return res.status(400).json({ message: 'Invalid or inactive PIN' });
    }
    if (pin.expiresAt && new Date(pin.expiresAt) < new Date()) {
      return res.status(400).json({ message: 'This PIN has expired' });
    }

    const questions = await prisma.question.findMany({
      where: {
        id: { in: pin.questionIds }
      },
      select: { id: true, question: true, options: true, difficulty: true }
    });

    if (questions.length === 0) {
      return res.status(400).json({ message: 'No questions available for this PIN' });
    }

    const quizSession = await prisma.quizSession.create({
      data: {
        userId: req.user.id,
        categoryId: pin.categoryId,
        totalQuestions: questions.length,
        gameMode: 'pin',
        pin: code,
        questions: {
          create: questions.map(q => ({
            questionId: q.id
          }))
        }
      }
    });

    res.json({
      sessionId: quizSession.id,
      questions,
      totalQuestions: questions.length,
      categoryId: pin.categoryId,
      wardName: pin.wardName
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
