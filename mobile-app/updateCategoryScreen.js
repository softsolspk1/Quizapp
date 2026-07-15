const fs = require('fs');

let content = fs.readFileSync('src/screens/CategoryScreen.js', 'utf8');

// 1. Add difficulty state
content = content.replace(
  "const [loading, setLoading] = useState(false);",
  "const [loading, setLoading] = useState(false);\n  const [difficulty, setDifficulty] = useState('all');"
);

// 2. Update loadQuestions
const newLoadQuestions = `  const loadQuestions = async () => {
    setLoading(true);
    try {
      let url = \`\${API_URL}/api/questions/category/\${category.id}?limit=20\`;
      if (difficulty !== 'all') {
        url += \`&difficulty=\${difficulty}\`;
      }
      const response = await axios.get(url);
      setQuestions(response.data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [difficulty]);`;

content = content.replace(/  const loadQuestions = async \(\) => \{[\s\S]*?\}, \[\]\);/m, newLoadQuestions);

// 3. Insert filter UI
const filterUI = `        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Difficulty Level</Text>
          <View style={styles.filterContainer}>
            {['all', 'easy', 'medium', 'hard'].map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.filterButton,
                  difficulty === level && styles.filterButtonActive
                ]}
                onPress={() => setDifficulty(level)}
              >
                <Text style={[
                  styles.filterText,
                  difficulty === level && styles.filterTextActive
                ]}>
                  {level === 'all' ? 'All' : level === 'easy' ? 'Basic Level' : level === 'medium' ? 'Intermediate Level' : 'Advance Level'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Game Mode</Text>`;

content = content.replace(
  /<View style=\{styles\.section\}>\s*<Text style=\{styles\.sectionTitle\}>Choose Game Mode<\/Text>/,
  filterUI
);

// 4. Add styles
const newStyles = `
  filterContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  filterButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f3f4f6', borderWidth: 1, borderColor: '#e5e7eb' },
  filterButtonActive: { backgroundColor: '#4c1d95', borderColor: '#4c1d95' },
  filterText: { color: '#4b5563', fontSize: 14, fontFamily: 'Inter-Medium' },
  filterTextActive: { color: 'white' },
`;
content = content.replace(
  "const styles = StyleSheet.create({",
  "const styles = StyleSheet.create({" + newStyles
);

fs.writeFileSync('src/screens/CategoryScreen.js', content);
console.log('CategoryScreen.js updated successfully');
