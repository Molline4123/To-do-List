// DOM Elements
const elements = {
  taskInput: document.getElementById('taskInput'),
  categoryInput: document.getElementById('categoryInput'),
  priorityInput: document.getElementById('priorityInput'),
  dueDateInput: document.getElementById('dueDateInput'),
  addTaskBtn: document.getElementById('addTaskBtn'),
  searchInput: document.getElementById('searchInput'),
  filterCategory: document.getElementById('filterCategory'),
  filterPriority: document.getElementById('filterPriority'),
  taskList: document.getElementById('taskList'),
  themeToggle: document.getElementById('themeToggle'),
  taskCount: document.getElementById('taskCount'),
  clearCompletedBtn: document.getElementById('clearCompletedBtn')
};

// State
let state = {
  tasks: [],
  totalTasks: 0,
  completedTasks: 0,
  draggedItem: null
};

// Initialize
function init() {
  loadTasks();
  setupEventListeners();
  checkDueDates();
}

// Event Listeners
function setupEventListeners() {
  elements.addTaskBtn.addEventListener('click', addNewTask);
  elements.clearCompletedBtn.addEventListener('click', clearCompletedTasks);
  elements.searchInput.addEventListener('input', filterTasks);
  elements.filterCategory.addEventListener('change', filterTasks);
  elements.filterPriority.addEventListener('change', filterTasks);
  elements.themeToggle.addEventListener('click', toggleTheme);
  elements.taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addNewTask();
  });
}

// Task Functions
function addNewTask() {
  const taskText = elements.taskInput.value.trim();
  if (!taskText) return;

  const newTask = {
    id: Date.now(),
    text: taskText,
    category: elements.categoryInput.value,
    priority: elements.priorityInput.value,
    dueDate: elements.dueDateInput.value,
    completed: false,
    createdAt: new Date().toISOString()
  };

  addTaskToDOM(newTask);
  state.tasks.push(newTask);
  state.totalTasks++;
  updateTaskCount();
  saveTasks();
  resetForm();
}

function addTaskToDOM(task) {
  const li = document.createElement('li');
  li.setAttribute('data-id', task.id);
  li.setAttribute('data-priority', task.priority);
  li.setAttribute('draggable', true);

  if (task.completed) li.classList.add('completed');
  if (isOverdue(task.dueDate) && !task.completed) li.classList.add('overdue');

  li.innerHTML = `
    <div class="task-details">
      <strong>${task.text}</strong>
      <small>Category: ${task.category}</small>
      <small>Due: ${formatDueDate(task.dueDate)}</small>
      <small>Priority: ${task.priority}</small>
    </div>
    <div class="button-container">
      <button class="edit-btn">Edit</button>
      <button class="delete-btn">Delete</button>
    </div>
  `;

  // Event listeners for dynamically created elements
  li.querySelector('.edit-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    editTask(li, task);
  });

  li.querySelector('.delete-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    deleteTask(li, task.id);
  });

  li.addEventListener('click', () => toggleTaskCompletion(li, task));
  li.addEventListener('dragstart', handleDragStart);
  li.addEventListener('dragover', handleDragOver);
  li.addEventListener('drop', handleDrop);
  li.addEventListener('dragend', handleDragEnd);

  elements.taskList.appendChild(li);
}

function editTask(li, task) {
  elements.taskInput.value = task.text;
  elements.categoryInput.value = task.category;
  elements.priorityInput.value = task.priority;
  elements.dueDateInput.value = task.dueDate;

  elements.addTaskBtn.textContent = 'Save Changes';
  const originalClick = elements.addTaskBtn.onclick;
  
  elements.addTaskBtn.onclick = () => {
    const updatedTask = {
      ...task,
      text: elements.taskInput.value.trim(),
      category: elements.categoryInput.value,
      priority: elements.priorityInput.value,
      dueDate: elements.dueDateInput.value
    };

    if (updatedTask.text) {
      li.remove();
      addTaskToDOM(updatedTask);
      state.tasks = state.tasks.map(t => t.id === task.id ? updatedTask : t);
      saveTasks();
      resetForm();
      elements.addTaskBtn.onclick = originalClick;
    }
  };
}

function deleteTask(li, taskId) {
  if (li.classList.contains('completed')) state.completedTasks--;
  li.remove();
  state.tasks = state.tasks.filter(task => task.id !== taskId);
  state.totalTasks--;
  updateTaskCount();
  saveTasks();
}

function toggleTaskCompletion(li, task) {
  li.classList.toggle('completed');
  task.completed = !task.completed;
  
  if (task.completed) {
    state.completedTasks++;
    li.classList.remove('overdue');
  } else {
    state.completedTasks--;
    if (isOverdue(task.dueDate)) li.classList.add('overdue');
  }
  
  updateTaskCount();
  saveTasks();
}

function clearCompletedTasks() {
  const completedItems = elements.taskList.querySelectorAll('.completed');
  completedItems.forEach(item => {
    const taskId = parseInt(item.getAttribute('data-id'));
    state.tasks = state.tasks.filter(task => task.id !== taskId);
    item.remove();
  });
  
  state.totalTasks -= completedItems.length;
  state.completedTasks = 0;
  updateTaskCount();
  saveTasks();
}

// Filter/Sort Functions
function filterTasks() {
  const searchQuery = elements.searchInput.value.toLowerCase();
  const categoryFilter = elements.filterCategory.value;
  const priorityFilter = elements.filterPriority.value;

  elements.taskList.querySelectorAll('li').forEach(li => {
    const text = li.querySelector('strong').textContent.toLowerCase();
    const category = li.querySelector('small').textContent.split(': ')[1];
    const priority = li.getAttribute('data-priority');

    const matchesSearch = text.includes(searchQuery);
    const matchesCategory = categoryFilter === 'All' || category === categoryFilter;
    const matchesPriority = priorityFilter === 'All' || priority === priorityFilter;

    li.style.display = matchesSearch && matchesCategory && matchesPriority ? 'flex' : 'none';
  });
}

// Drag and Drop
function handleDragStart(e) {
  state.draggedItem = this;
  e.dataTransfer.effectAllowed = 'move';
  this.classList.add('dragging');
}

function handleDragOver(e) {
  e.preventDefault();
  const afterElement = getDragAfterElement(elements.taskList, e.clientY);
  const currentItem = document.querySelector('.dragging');
  
  if (afterElement == null) {
    elements.taskList.appendChild(currentItem);
  } else {
    elements.taskList.insertBefore(currentItem, afterElement);
  }
}

function handleDrop(e) {
  e.preventDefault();
  this.classList.remove('dragging');
  saveTasks();
}

function handleDragEnd() {
  this.classList.remove('dragging');
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('li:not(.dragging)')];
  
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    return offset < 0 && offset > closest.offset 
      ? { offset: offset, element: child } 
      : closest;
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Due Date Functions
function isOverdue(dueDate) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

function formatDueDate(dateString) {
  if (!dateString) return 'No due date';
  return new Date(dateString).toLocaleDateString();
}

function checkDueDates() {
  state.tasks.forEach(task => {
    if (isOverdue(task.dueDate)) {
      const li = document.querySelector(`li[data-id="${task.id}"]`);
      if (li && !task.completed) li.classList.add('overdue');
    }
  });
}

// Utility Functions
function updateTaskCount() {
  elements.taskCount.textContent = `${state.completedTasks} of ${state.totalTasks} tasks completed`;
}

function resetForm() {
  elements.taskInput.value = '';
  elements.categoryInput.value = 'Personal';
  elements.priorityInput.value = 'Low';
  elements.dueDateInput.value = '';
  elements.addTaskBtn.textContent = 'Add Task';
  elements.taskInput.focus();
}

function saveTasks() {
  const tasksToSave = [];
  elements.taskList.querySelectorAll('li').forEach(li => {
    const taskId = parseInt(li.getAttribute('data-id'));
    const existingTask = state.tasks.find(t => t.id === taskId);
    if (existingTask) {
      tasksToSave.push({
        ...existingTask,
        completed: li.classList.contains('completed')
      });
    }
  });
  localStorage.setItem('tasks', JSON.stringify(tasksToSave));
}

function loadTasks() {
  const savedTasks = JSON.parse(localStorage.getItem('tasks')) || [];
  state.tasks = savedTasks;
  state.totalTasks = savedTasks.length;
  state.completedTasks = savedTasks.filter(t => t.completed).length;
  
  elements.taskList.innerHTML = '';
  savedTasks.forEach(task => addTaskToDOM(task));
  updateTaskCount();
}

// Theme Functions
function toggleTheme() {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  elements.themeToggle.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// Initialize theme
if (localStorage.getItem('theme') === 'dark') {
  document.body.classList.add('dark');
  elements.themeToggle.textContent = '☀️ Light Mode';
}

// Initialize app
init();