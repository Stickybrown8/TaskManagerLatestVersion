const fs = require('fs');

console.log('🔧 Correction complète axios -> fetch...\n');

let content = fs.readFileSync('TimerPopup.tsx', 'utf8');

// 1. Supprimer l'import axios
content = content.replace(/import axios from ['"]axios['"];\n/g, '');

// 2. Fonction helper pour convertir les appels axios
function convertAxiosToFetch(content) {
  // Remplacer fetchClientsAndTasks
  content = content.replace(
    /const \[clientsRes, tasksRes\] = await Promise\.all\(\[\s*axios\.get[^;]+;\s*setClients\(clientsRes\.data\);\s*setTasks\(tasksRes\.data\);/s,
    `const [clientsRes, tasksRes] = await Promise.all([
        fetch(\`\${API_URL}/api/clients\`, { 
          headers: { Authorization: \`Bearer \${token}\` } 
        }).then(res => res.json()),
        fetch(\`\${API_URL}/api/tasks\`, { 
          headers: { Authorization: \`Bearer \${token}\` } 
        }).then(res => res.json())
      ]);

      setClients(clientsRes);
      setTasks(tasksRes);`
  );

  // Remplacer tous les axios.get simples
  content = content.replace(
    /const (\w+) = await axios\.get\(`([^`]+)`\, \{\s*headers: \{ ['"]?Authorization['"]?: `Bearer \$\{token\}` \}\s*\}\);/g,
    'const $1Response = await fetch(`$2`, {\n        headers: { \'Authorization\': `Bearer ${token}` }\n      });\n      const $1 = await $1Response.json();'
  );

  // Remplacer les .data restants
  content = content.replace(/(\w+)Res\.data/g, '$1Res');
  content = content.replace(/response\.data/g, 'responseData');

  // Corriger fetchClientDetails
  const fetchClientDetailsStart = content.indexOf('const fetchClientDetails = async (clientId: string) => {');
  const fetchClientDetailsEnd = content.indexOf('};', fetchClientDetailsStart) + 2;
  
  if (fetchClientDetailsStart !== -1) {
    const newFetchClientDetails = `const fetchClientDetails = async (clientId: string) => {
    console.log("📊 fetchClientDetails appelé pour:", clientId);
    
    try {
      const token = localStorage.getItem('token');
      if (!token || !clientId) {
        console.warn("⚠️ Token ou clientId manquant");
        return;
      }

      // 1. Récupérer le client
      console.log("1️⃣ Récupération client...");
      const clientResponse = await fetch(\`\${API_URL}/api/clients/\${clientId}\`, {
        headers: { 'Authorization': \`Bearer \${token}\` }
      });
      const clientData = await clientResponse.json();
      console.log("✅ Client récupéré:", clientData);
      setSelectedClient(clientData);

      // 2. Récupérer la rentabilité
      console.log("2️⃣ Récupération rentabilité...");
      try {
        const profitUrl = \`\${API_URL}/api/profitability/client/\${clientId}\`;
        console.log("URL rentabilité:", profitUrl);
        
        const profitResponse = await fetch(profitUrl, {
          headers: { 'Authorization': \`Bearer \${token}\` }
        });
        
        if (profitResponse.ok) {
          const profitData = await profitResponse.json();
          console.log("✅ Rentabilité récupérée:", profitData);
          
          const mappedData = {
            hourlyRate: profitData.hourlyRate || 0,
            targetHours: profitData.targetHours || 0,
            spentHours: profitData.actualHours || profitData.spentHours || 0,
            monthlyBudget: profitData.revenue || 0,
            revenue: profitData.revenue || 0,
            profit: profitData.profit || 0,
            profitability: profitData.profitability || 0
          };
          
          console.log("📊 Données mappées:", mappedData);
          setProfitability(mappedData);
          calculateInitialHourlyRate(mappedData);
          
          const remaining = mappedData.targetHours - mappedData.spentHours;
          setHoursRemaining(remaining);
          setIsOverBudget(remaining < 0);
        } else if (profitResponse.status === 404) {
          console.log("📝 Création de données par défaut...");
          setProfitability({
            hourlyRate: 50,
            targetHours: 0,
            spentHours: 0,
            monthlyBudget: 0
          });
          setCurrentHourlyRate(50);
        }
      } catch (profitError: any) {
        console.error("❌ Erreur rentabilité:", profitError);
        setProfitability(null);
      }
    } catch (error: any) {
      console.error("❌ Erreur globale fetchClientDetails:", error);
      setSelectedClient(null);
      setProfitability(null);
    }
  };`;
    
    content = content.substring(0, fetchClientDetailsStart) + 
              newFetchClientDetails + 
              content.substring(fetchClientDetailsEnd);
  }

  // Corriger fetchTaskDetails
  content = content.replace(
    /const fetchTaskDetails = async \(taskId: string\) => \{[\s\S]*?\n  \};/,
    `const fetchTaskDetails = async (taskId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !taskId) return;

      const response = await fetch(\`\${API_URL}/api/tasks/\${taskId}\`, {
        headers: { Authorization: \`Bearer \${token}\` }
      });
      const taskData = await response.json();
      
      setSelectedTask(taskData);
      if (taskData.clientId && !selectedClientId) {
        const clientId = taskData.clientId._id || taskData.clientId;
        setSelectedClientId(clientId);
        fetchClientDetails(clientId);
      }
    } catch (error) {
      console.error('Erreur détails tâche:', error);
    }
  };`
  );

  // Corriger handleStopTimer
  content = content.replace(
    /await axios\.get\(`\$\{API_URL\}\/api\/tasks\/\$\{selectedTaskId\}`[^;]+;/g,
    `const taskResponse = await fetch(\`\${API_URL}/api/tasks/\${selectedTaskId}\`, {
            headers: { Authorization: \`Bearer \${token}\` }
          });
          const currentTask = await taskResponse.json();`
  );

  content = content.replace(
    /await axios\.put\(`\$\{API_URL\}\/api\/tasks\/\$\{selectedTaskId\}`[^;]+\);/g,
    `await fetch(\`\${API_URL}/api/tasks/\${selectedTaskId}\`, {
            method: 'PUT',
            headers: { 
              'Authorization': \`Bearer \${token}\`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ actualTime: newTotalTime })
          });`
  );

  content = content.replace(
    /await axios\.put\(`\$\{API_URL\}\/api\/profitability\/update-hours[^;]+\);/g,
    `await fetch(\`\${API_URL}/api/profitability/update-hours/\${selectedClientId}\`, {
            method: 'PUT',
            headers: { 
              'Authorization': \`Bearer \${token}\`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
          });`
  );

  // Corriger handleCreateTask
  content = content.replace(
    /const response = await axios\.post\(`\$\{API_URL\}\/api\/tasks`[^;]+;/g,
    `const response = await fetch(\`\${API_URL}/api/tasks\`, {
        method: 'POST',
        headers: { 
          'Authorization': \`Bearer \${token}\`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(taskData)
      });
      const responseData = await response.json();`
  );

  content = content.replace(/dispatch\(addTask\(response\.data\)\);/g, 'dispatch(addTask(responseData));');
  content = content.replace(/setSelectedTaskId\(response\.data\._id\);/g, 'setSelectedTaskId(responseData._id);');
  content = content.replace(/setSelectedTask\(response\.data\);/g, 'setSelectedTask(responseData);');

  // Corriger handleFinishTask
  content = content.replace(
    /await axios\.put\(`\$\{API_URL\}\/api\/tasks\/\$\{selectedTaskId\}`[^}]+\}\s*\);/g,
    `await fetch(\`\${API_URL}/api/tasks/\${selectedTaskId}\`, {
        method: 'PUT',
        headers: { 
          'Authorization': \`Bearer \${token}\`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'terminée' })
      });`
  );

  return content;
}

content = convertAxiosToFetch(content);

// Sauvegarder
fs.writeFileSync('TimerPopup.tsx', content);
console.log('✅ Fichier corrigé et sauvegardé!');

// Vérifier s'il reste des références à axios
const lines = content.split('\n');
let hasAxios = false;
lines.forEach((line, i) => {
  if (line.includes('axios')) {
    console.log(`⚠️  Ligne ${i+1} contient encore 'axios': ${line.trim()}`);
    hasAxios = true;
  }
});

if (!hasAxios) {
  console.log('✅ Toutes les références à axios ont été supprimées!');
}
