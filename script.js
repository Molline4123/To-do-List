const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');
const searchInput = document.getElementById('searchInput');
const dueDateInput = document.getElementById('dueDateInput');
const categoryInput = document.getElementById('categoryInput');

addTaskBtn.addEventListener('click', () => {
  const taskText = taskInput.value.trim();
  const category = categoryInput.value;
  const dueDate = dueDateInput.value;

  if (taskText !== '') {
    const task = {
      id: Date.now(), // Unique ID for each task
      text: taskText,
      category: category,
      dueDate: dueDate,
      completed: false
    };
    addTask(task);
    saveTasks();
    taskInput.value = '';
    dueDateInput.value = '';
  }
});

function addTask(task) {
  const li = document.createElement('li');
  li.setAttribute('data-id', task.id);

  // Task text and details
  const taskDetails = document.createElement('div');
  taskDetails.innerHTML = `
    <strong>${task.text}</strong>
    <br>
    <small>Category: ${task.category}</small>
    <br>
    <small>Due: ${task.dueDate || 'No due date'}</small>
  `;

  // Delete button
  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = 'Delete';
  deleteBtn.addEventListener('click', () => {
    taskList.removeChild(li);
    saveTasks();
  });

  // Complete task
  li.addEventListener('click', () => {
    li.classList.toggle('completed');
    task.completed = !task.completed;
    saveTasks();
  });

  // Append elements
  li.appendChild(taskDetails);
  li.appendChild(deleteBtn);
  taskList.appendChild(li);
}

function saveTasks() {
  const tasks = [];
  document.querySelectorAll('#taskList li').forEach(li => {
    const task = {
      id: li.getAttribute('data-id'),
      text: li.querySelector('strong').textContent,
      category: li.querySelector('small').textContent.replace('Category: ', ''),
      dueDate: li.querySelectorAll('small')[1].textContent.replace('Due: ', ''),
      completed: li.classList.contains('completed')
    };
    tasks.push(task);
  });
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadTasks() {
  const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  tasks.forEach(task => addTask(task));
}

loadTasks();
searchInput.addEventListener('input', () => {
  const query = searchInput.value.toLowerCase();
  document.querySelectorAll('#taskList li').forEach(li => {
    const taskText = li.querySelector('strong').textContent.toLowerCase();
    if (taskText.includes(query)) {
      li.style.display = 'flex';
    } else {
      li.style.display = 'none';
    }
  });
});
// Select the theme toggle button
const themeToggle = document.getElementById('themeToggle');

// Check localStorage for saved theme preference
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  document.body.classList.add('dark');
  themeToggle.textContent = '☀️ Light Mode';
} else {
  document.body.classList.remove('dark');
  themeToggle.textContent = '🌙 Dark Mode';
}

// Toggle between light and dark modes
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  if (document.body.classList.contains('dark')) {
    themeToggle.textContent = '☀️ Light Mode';
    localStorage.setItem('theme', 'dark');
  } else {
    themeToggle.textContent = '🌙 Dark Mode';
    localStorage.setItem('theme', 'light');
  }
});
