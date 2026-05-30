import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper to clean filenames
function cleanFilename(name) {
  return name.replace(/[^a-zA-Z0-9_\-]/g, '_').toLowerCase();
}

async function exportUserData(targetEmailOrId) {
  if (!targetEmailOrId) {
    console.error("Please provide an email or User ID. Example: node inspect_user.js andhryn@gmail.com");
    process.exit(1);
  }

  console.log(`Searching for user: "${targetEmailOrId}"...`);

  // 1. Fetch Auth Users
  let allUsers = [];
  let page = 1;
  const perPage = 1000;
  while (true) {
    const { data: { users }, error } = await supabase.auth.admin.listUsers({
      page: page,
      perPage: perPage
    });
    if (error) {
      console.error("Error fetching users:", error);
      break;
    }
    if (!users || users.length === 0) break;
    allUsers.push(...users);
    if (users.length < perPage) break;
    page++;
  }

  const user = allUsers.find(u => u.email === targetEmailOrId || u.id === targetEmailOrId);
  if (!user) {
    console.error(`❌ User with email or ID "${targetEmailOrId}" not found.`);
    process.exit(1);
  }

  const email = user.email || 'no_email';
  const userId = user.id;

  console.log(`\nFound User:\n  ID: ${userId}\n  Email: ${email}\n  Signed Up: ${user.created_at}\n  Last Sign-in: ${user.last_sign_in_at || 'never'}`);

  // 2. Fetch Chat Sessions for this user
  console.log("\nFetching chat sessions...");
  const { data: sessions, error: sessionErr } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (sessionErr) {
    console.error("Error fetching chat sessions:", sessionErr);
    process.exit(1);
  }

  if (sessions.length === 0) {
    console.log("No chat sessions found for this user.");
    process.exit(0);
  }

  console.log(`Found ${sessions.length} chat sessions.`);

  // Create target directory
  const baseDir = path.join('/Users/macbookair/Projects/ScholarGo', 'user_data', cleanFilename(email));
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }

  console.log(`Exporting data to: ${baseDir}\n`);

  for (let i = 0; i < sessions.length; i++) {
    const s = sessions[i];
    const cleanTitle = cleanFilename(s.title || `untitled_session_${i + 1}`);
    const sessionDirName = `${i + 1}_${cleanTitle}`;
    const sessionDir = path.join(baseDir, sessionDirName);
    
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    console.log(`[${i + 1}/${sessions.length}] Processing "${s.title || 'Untitled Session'}"...`);

    // A. Export Essay Content and Versions
    let hasEssay = false;
    if (s.payload) {
      if (s.payload.essayContent) {
        fs.writeFileSync(path.join(sessionDir, 'essay_current.html'), s.payload.essayContent);
        // Also save text-only version
        const textOnly = s.payload.essayContent.replace(/<[^>]*>/g, '\n').replace(/\n\s*\n/g, '\n').trim();
        fs.writeFileSync(path.join(sessionDir, 'essay_current.txt'), textOnly);
        hasEssay = true;
      }
      
      if (Array.isArray(s.payload.versions)) {
        s.payload.versions.forEach(v => {
          const verName = `version_${v.id}_${cleanFilename(v.title || 'untitled')}.html`;
          fs.writeFileSync(path.join(sessionDir, verName), v.content || '');
          hasEssay = true;
        });
      }
    }

    // B. Fetch and Export Chat Messages for this session
    const { data: messages, error: msgErr } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', s.id)
      .order('created_at', { ascending: true });

    if (msgErr) {
      console.error(`  Error fetching messages for session ${s.id}:`, msgErr);
      continue;
    }

    let chatMarkdown = `# Chat Session: ${s.title || 'Untitled'}\n`;
    chatMarkdown += `*Created At: ${s.created_at}*\n`;
    chatMarkdown += `*Session ID: ${s.id}*\n\n---\n\n`;

    if (messages && messages.length > 0) {
      messages.forEach(m => {
        const roleName = m.role === 'user' ? 'User' : 'ScholarGo AI';
        chatMarkdown += `### 👤 **${roleName}** (${m.created_at})\n\n`;
        chatMarkdown += `${m.content}\n\n`;
        
        if (m.payload && Object.keys(m.payload).length > 0) {
          chatMarkdown += `<details>\n<summary>View Payload / Debug Data</summary>\n\n\`\`\`json\n${JSON.stringify(m.payload, null, 2)}\n\`\`\`\n</details>\n\n`;
        }
        
        chatMarkdown += `---\n\n`;
      });
      fs.writeFileSync(path.join(sessionDir, 'chat_history.md'), chatMarkdown);
    } else {
      chatMarkdown += "*No messages in this chat session.*";
      fs.writeFileSync(path.join(sessionDir, 'chat_history.md'), chatMarkdown);
    }

    console.log(`  Saved essay: ${hasEssay ? 'Yes' : 'No'}, Messages: ${messages ? messages.length : 0}`);
  }

  console.log(`\n🎉 Export complete! Please check the output directory:`);
  console.log(`   file://${baseDir}`);
}

const args = process.argv.slice(2);
exportUserData(args[0]);
