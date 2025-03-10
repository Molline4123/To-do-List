// Select DOM elements
const taskInput = document.getElementById('taskInput');
const categoryInput = document.getElementById('categoryInput');
const dueDateInput = document.getElementById('dueDateInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const searchInput = document.getElementById('searchInput');
const taskList = document.getElementById('taskList');
const themeToggle = document.getElementById('themeToggle');

// Load tasks from localStorage
function loadTasks() {
  const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  tasks.forEach(task => addTask(task));
}

// Add a new task
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

// Create a task element
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

  // Edit button
  const editBtn = document.createElement('button');
  editBtn.textContent = 'Edit';
  editBtn.classList.add('edit-btn');
  editBtn.addEventListener('click', () => editTask(li, task));

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
  li.appendChild(deleteBtn);
  taskList.appendChild(li);
}

// Save tasks to localStorage
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

// Search and filter tasks
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

// Light/Dark Mode Toggle
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  document.body.classList.add('dark');
  themeToggle.textContent = '☀️ Light Mode';
} else {
  document.body.classList.remove('dark');
  themeToggle.textContent = '🌙 Dark Mode';
}

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

function editTask(li, task) {
  // Populate input fields with task details
  taskInput.value = task.text;
  categoryInput.value = task.category;
  dueDateInput.value = task.dueDate;

  // Change the "Add Task" button to "Save Changes"
  addTaskBtn.textContent = 'Save Changes';

  // Remove the old task when saving changes
  addTaskBtn.onclick = () => {
    const updatedTask = {
      id: task.id,
      text: taskInput.value.trim(),
      category: categoryInput.value,
      dueDate: dueDateInput.value,
      completed: task.completed
    };

    if (updatedTask.text !== '') {
      taskList.removeChild(li);
      addTask(updatedTask);
      saveTasks();
      resetForm();
    }
  };
}

// Reset the form after editing
function resetForm() {
  taskInput.value = '';
  categoryInput.value = 'Personal';
  dueDateInput.value = '';
  addTaskBtn.textContent = 'Add Task';
  addTaskBtn.onclick = () => {
    const taskText = taskInput.value.trim();
    const category = categoryInput.value;
    const dueDate = dueDateInput.value;

    if (taskText !== '') {
      const task = {
        id: Date.now(),
        text: taskText,
        category: category,
        dueDate: dueDate,
        completed: false
      };
      addTask(task);
      saveTasks();
      resetForm();
    }
  };
}

// Load tasks when the page loads
loadTasks();
