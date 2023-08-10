const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const { exec } = require('child_process');

const app = express();

app.set('view engine', 'ejs'); // Set the view engine to EJS

// Middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  secret: 'your-secret-key',
  resave: true,
  saveUninitialized: true
}));
app.use(flash());

// Set up a basic route
app.get('/', (req, res) => {
  res.render('index', { message: req.flash('message'), output: req.flash('output') });
});

// Route to handle Git commands
app.post('/git-command', (req, res) => {
  const preselect = req.body.preselect;
  const parameter1 = req.body.parameter1;
//   const additionalCommand = req.body.additionalCommand;
  const directory = req.body.directory || process.cwd(); // Use current directory if not provided

  let gitCommand = '';

  // Construct the Git command based on preselect and additional command
  switch (preselect) {
    case 'clone':
      gitCommand = `git clone ${parameter1}`;
      break;
    case 'stash':
      gitCommand = 'git stash';
      break;
    case 'stash-apply':
      gitCommand = 'git stash apply';
      break;
    case 'pull':
      if (!parameter1) {
        gitCommand = 'git pull origin main'; // Default to pulling from 'main'
      } else {
        gitCommand = `git pull origin ${parameter1}`; // Pull from the specified branch
      }
      break;
    case 'logs':
      gitCommand = 'git log';
      break;
    default:
      gitCommand = preselect; // Use the preselect as a custom command
  }

  // Execute the Git command with directory
  const fullGitCommand = `git -C "${directory}" ${gitCommand}`;
  const finalCommand = req.body.useSudo === 'true' ? `sudo ${fullGitCommand}` : fullGitCommand;

  exec(finalCommand, (error, stdout, stderr) => {
    if (error) {
      req.flash('message', 'Error: ' + error.message);
    } else {
      req.flash('message', 'Command executed successfully.');
      req.flash('output', stdout); // Store output for display
    }
    res.redirect('/');
  });
});

app.listen(3020, () => {
  console.log('Server is running on port 3020');
});
