import { execSync } from 'child_process';

console.log('Installing framer-motion and jspdf...');
try {
  execSync('pnpm add framer-motion jspdf', { 
    stdio: 'inherit',
    cwd: '/vercel/share/v0-project'
  });
  console.log('Dependencies installed successfully!');
} catch (error) {
  console.error('Installation failed:', error);
  process.exit(1);
}
