const express = require('express');
const prisma = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// Get overall analytics (admin only)
router.get('/overview', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const [
      totalUsers,
      approvedUsers,
      totalQuestions,
      totalSessions,
      completedSessions,
      totalPointsAgg
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isApproved: true } }),
      prisma.question.count(),
      prisma.quizSession.count(),
      prisma.quizSession.count({ where: { isCompleted: true } }),
      prisma.user.aggregate({ _sum: { totalPoints: true } })
    ]);

    res.json({
      totalUsers,
      approvedUsers,
      pendingUsers: totalUsers - approvedUsers,
      totalQuestions,
      totalSessions,
      completedSessions,
      totalPointsEarned: totalPointsAgg._sum.totalPoints || 0
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Get user activity analytics
router.get('/user-activity', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [
      newUsers,
      activeUsers,
      recentSessions
    ] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: startDate } } }),
      prisma.user.count({ where: { lastLogin: { gte: startDate } } }),
      prisma.quizSession.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true }
      })
    ]);

    // Aggregate sessions by day
    const sessionsMap = {};
    recentSessions.forEach(s => {
      const dateKey = s.createdAt.toISOString().split('T')[0];
      sessionsMap[dateKey] = (sessionsMap[dateKey] || 0) + 1;
    });

    const sessionsByDay = Object.keys(sessionsMap).sort().map(date => ({
      _id: date,
      count: sessionsMap[date]
    }));

    res.json({
      newUsers,
      activeUsers,
      sessionsByDay
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Get category performance analytics
router.get('/category-performance', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const categories = await prisma.category.findMany({
      include: {
        questions: { select: { id: true } },
        quizSessions: { select: { isCompleted: true, score: true } }
      }
    });

    const categoryStats = categories.map(cat => {
      const completedSessions = cat.quizSessions.filter(s => s.isCompleted);
      const averageScore = completedSessions.length > 0
        ? completedSessions.reduce((acc, s) => acc + s.score, 0) / completedSessions.length
        : 0;

      return {
        _id: cat.id,
        name: cat.name,
        description: cat.description,
        questionCount: cat.questions.length,
        sessionCount: cat.quizSessions.length,
        completedSessions: completedSessions.length,
        averageScore
      };
    }).sort((a, b) => b.sessionCount - a.sessionCount);

    res.json(categoryStats);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Get question performance analytics
router.get('/question-performance', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const categoryId = parseInt(req.query.categoryId);
    const limit = parseInt(req.query.limit) || 20;

    let query = {};
    if (categoryId) {
      query.categoryId = categoryId;
    }

    const questions = await prisma.question.findMany({
      where: query,
      orderBy: { timesAnswered: 'desc' },
      take: limit,
      include: {
        category: { select: { name: true } }
      }
    });

    const questionStats = questions.map(q => {
      const successRate = q.timesAnswered === 0 ? 0 : (q.correctCount / q.timesAnswered) * 100;
      return {
        _id: q.id,
        question: q.question,
        category: q.categoryId,
        categoryInfo: [q.category],
        difficulty: q.difficulty,
        timesAnswered: q.timesAnswered,
        correctCount: q.correctCount,
        successRate
      };
    });

    res.json(questionStats);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Get top performers
router.get('/top-performers', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const limit = parseInt(req.query.limit) || 100;
    const specialty = req.query.specialty;
    
    let whereClause = { isApproved: true, isActive: true };
    if (specialty && specialty !== 'All') {
      whereClause.specialty = specialty;
    }

    const topPerformers = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        doctorName: true,
        profilePicture: true,
        specialty: true,
        hospitalName: true,
        totalPoints: true,
        gamesPlayed: true,
        correctAnswers: true,
        wrongAnswers: true
      },
      orderBy: { totalPoints: 'desc' },
      take: limit
    });

    res.json(topPerformers);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Get game mode statistics
router.get('/game-mode-stats', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const sessions = await prisma.quizSession.findMany({
      select: {
        gameMode: true,
        isCompleted: true,
        score: true
      }
    });

    const statsMap = {};
    sessions.forEach(s => {
      if (!statsMap[s.gameMode]) {
        statsMap[s.gameMode] = {
          _id: s.gameMode,
          totalSessions: 0,
          completedSessions: 0,
          totalPoints: 0
        };
      }
      statsMap[s.gameMode].totalSessions++;
      if (s.isCompleted) {
        statsMap[s.gameMode].completedSessions++;
        statsMap[s.gameMode].totalPoints += s.score;
      }
    });

    const gameModeStats = Object.values(statsMap).map(stat => ({
      ...stat,
      averageScore: stat.completedSessions > 0 ? stat.totalPoints / stat.completedSessions : 0
    }));

    res.json(gameModeStats);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Get user's personal analytics
router.get('/personal', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const [
      totalSessions,
      completedSessions,
      completedSessionsData,
      recentSessions
    ] = await Promise.all([
      prisma.quizSession.count({ where: { userId: req.user.id } }),
      prisma.quizSession.count({ where: { userId: req.user.id, isCompleted: true } }),
      prisma.quizSession.findMany({
        where: { userId: req.user.id, isCompleted: true },
        include: { category: { select: { name: true } } }
      }),
      prisma.quizSession.findMany({
        where: { userId: req.user.id, isCompleted: true },
        include: { category: { select: { name: true } } },
        orderBy: { completedAt: 'desc' },
        take: 5
      })
    ]);

    const catStatsMap = {};
    completedSessionsData.forEach(s => {
      if (!catStatsMap[s.categoryId]) {
        catStatsMap[s.categoryId] = {
          _id: s.categoryId,
          categoryName: s.category.name,
          sessionsPlayed: 0,
          totalScore: 0,
          bestScore: 0
        };
      }
      catStatsMap[s.categoryId].sessionsPlayed++;
      catStatsMap[s.categoryId].totalScore += s.score;
      if (s.score > catStatsMap[s.categoryId].bestScore) {
        catStatsMap[s.categoryId].bestScore = s.score;
      }
    });

    const categoryStats = Object.values(catStatsMap).map(stat => ({
      _id: stat._id,
      categoryName: stat.categoryName,
      sessionsPlayed: stat.sessionsPlayed,
      averageScore: stat.totalScore / stat.sessionsPlayed,
      bestScore: stat.bestScore
    })).sort((a, b) => b.sessionsPlayed - a.sessionsPlayed);

    const accuracy = user.correctAnswers + user.wrongAnswers > 0 
      ? (user.correctAnswers / (user.correctAnswers + user.wrongAnswers) * 100).toFixed(2)
      : 0;

    res.json({
      totalPoints: user.totalPoints,
      gamesPlayed: user.gamesPlayed,
      correctAnswers: user.correctAnswers,
      wrongAnswers: user.wrongAnswers,
      accuracy: parseFloat(accuracy),
      totalSessions,
      completedSessions,
      categoryStats,
      recentSessions
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
