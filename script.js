// DOM Elements
const elements = {
  taskInput: document.getElementById('taskInput'),
  categoryInput: document.getElementById('categoryInput'),
  priorityInput: document.getElementById('priorityInput'),
  dueDateInput: document.getElementById('dueDateInput'),
  dependencyInput: document.getElementById('dependencyInput'),
  addTaskBtn: document.getElementById('addTaskBtn'),
  searchInput: document.getElementById('searchInput'),
  filterCategory: document.getElementById('filterCategory'),
  filterPriority: document.getElementById('filterPriority'),
  taskList: document.getElementById('taskList'),
  themeToggle: document.getElementById('themeToggle'),
  taskCount: document.getElementById('taskCount'),
  clearCompletedBtn: document.getElementById('clearCompletedBtn'),
  voiceBtn: document.getElementById('voiceBtn'),
  progressChart: document.getElementById('progressChart')
};

// State
let state = {
  tasks: [],
  totalTasks: 0,
  completedTasks: 0,
  draggedItem: null,
  chart: null
};

// Initialize
function init() {
  loadTasks();
  setupEventListeners();
  checkDueDates();
  setupVoiceCommands();
  renderProgressChart();
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

  const selectedDependencies = Array.from(elements.dependencyInput.selectedOptions)
    .map(option => parseInt(option.value))
    .filter(id => !isNaN(id));

  const newTask = {
    id: Date.now(),
    text: taskText,
    category: elements.categoryInput.value,
    priority: elements.priorityInput.value,
    dueDate: elements.dueDateInput.value,
    dependsOn: selectedDependencies,
    completed: false,
    createdAt: new Date().toISOString()
  };

  addTaskToDOM(newTask);
  state.tasks.push(newTask);
  state.totalTasks++;
  updateTaskCount();
  saveTasks();
  resetForm();
  updateDependencyDropdown();
}

function addTaskToDOM(task) {
  const li = document.createElement('li');
  li.setAttribute('data-id', task.id);
  li.setAttribute('data-priority', task.priority);
  li.setAttribute('draggable', true);

  if (task.completed) li.classList.add('completed');
  if (isOverdue(task.dueDate) && !task.completed) li.classList.add('overdue');

  // Check dependencies
  const blockerInfo = checkDependencies(task);
  if (blockerInfo.hasBlockers && !task.completed) {
    li.classList.add('blocked');
  }

  li.innerHTML = `
    <div class="task-details">
      <strong>${task.text}</strong>
      <small>Category: ${task.category}</small>
      <small>Due: ${formatDueDate(task.dueDate)}</small>
      <small>Priority: ${task.priority}</small>
      ${blockerInfo.hasBlockers ? `
        <small class="dependency-warning">
          Requires: ${blockerInfo.blockerCount} task${blockerInfo.blockerCount !== 1 ? 's' : ''}
        </small>
        <div class="dependency-list">
          ${blockerInfo.blockerNames.map(name => `
            <span class="dependency-tag">${name}</span>
          `).join('')}
        </div>
      ` : ''}
    </div>
    <div class="button-container">
      <button class="edit-btn">Edit</button>
      <button class="share-btn">Share</button>
      <button class="delete-btn">Delete</button>
    </div>
  `;

  // Event listeners for buttons
  li.querySelector('.edit-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    editTask(li, task);
  });

  li.querySelector('.delete-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    deleteTask(li, task.id);
  });

  li.querySelector('.share-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    shareTask(task);
  });

  // Task completion toggle
  li.addEventListener('click', () => toggleTaskCompletion(li, task));

  // Drag and drop
  li.addEventListener('dragstart', handleDragStart);
  li.addEventListener('dragover', handleDragOver);
  li.addEventListener('drop', handleDrop);
  li.addEventListener('dragend', handleDragEnd);

  elements.taskList.appendChild(li);
}

// Dependency Functions
function checkDependencies(task) {
  if (!task.dependsOn?.length) return { hasBlockers: false };
  
  const blockers = state.tasks.filter(t => 
    task.dependsOn.includes(t.id) && !t.completed
  );
  
  return {
    hasBlockers: blockers.length > 0,
    blockerCount: blockers.length,
    blockerNames: blockers.map(t => t.text.substring(0, 15) + (t.text.length > 15 ? '...' : ''))
  };
}

function updateDependencyDropdown() {
  const select = elements.dependencyInput;
  const currentSelections = Array.from(select.selectedOptions).map(opt => opt.value);
  
  select.innerHTML = '<option value="" disabled selected>Select dependencies</option>';
  
  state.tasks.forEach(task => {
    if (!task.completed) {
      const option = document.createElement('option');
      option.value = task.id;
      option.textContent = `${task.text.substring(0, 20)}${task.text.length > 20 ? '...' : ''}`;
      select.appendChild(option);
    }
  });

  // Restore selections
  currentSelections.forEach(val => {
    const option = Array.from(select.options).find(opt => opt.value === val);
    if (option) option.selected = true;
  });
}

function updateDependentTasks(taskId) {
  state.tasks.forEach(task => {
    if (task.dependsOn?.includes(taskId)) {
      const li = document.querySelector(`li[data-id="${task.id}"]`);
      if (li) {
        const blockers = checkDependencies(task);
        if (blockers.hasBlockers) {
          li.classList.add('blocked');
        } else {
          li.classList.remove('blocked');
        }
        
        // Update dependency warning
        const warningEl = li.querySelector('.dependency-warning');
        if (warningEl) {
          warningEl.textContent = blockers.hasBlockers ? 
            `Requires: ${blockers.blockerCount} task${blockers.blockerCount !== 1 ? 's' : ''}` : 
            'All dependencies completed';
        }
      }
    }
  });
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
    if (isOverdue(task.dueDate) && !task.completed) {
      const li = document.querySelector(`li[data-id="${task.id}"]`);
      if (li) li.classList.add('overdue');
    }
  });
}

// Progress Chart
function renderProgressChart() {
  if (state.chart) state.chart.destroy();
  
  const ctx = elements.progressChart.getContext('2d');
  state.chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Completed', 'Pending'],
      datasets: [{
        data: [state.completedTasks, state.totalTasks - state.completedTasks],
        backgroundColor: ['#2ecc71', '#e74c3c'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return `${context.label}: ${context.raw}`;
            }
          }
        }
      },
      cutout: '70%'
    }
  });
}

// Task Sharing
function shareTask(task) {
  if (navigator.share) {
    navigator.share({
      title: `Task: ${task.text}`,
      text: `Category: ${task.category}\nPriority: ${task.priority}\nDue: ${formatDueDate(task.dueDate)}`,
    }).catch(err => {
      console.log('Error sharing:', err);
    });
  } else {
    const shareText = `Task: ${task.text}\nCategory: ${task.category}\nPriority: ${task.priority}\nDue: ${formatDueDate(task.dueDate)}`;
    alert(`Share this task:\n\n${shareText}`);
  }
}

// Voice Commands
function setupVoiceCommands() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    elements.voiceBtn.style.display = 'none';
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;

  elements.voiceBtn.addEventListener('click', () => {
    recognition.start();
    elements.voiceBtn.textContent = "🎤 Listening...";
    elements.voiceBtn.style.backgroundColor = "#e74c3c";
  });

  recognition.onresult = (e) => {
    const command = e.results[0][0].transcript.toLowerCase();
    if (command.includes('add')) {
      const taskText = command.replace('add', '').trim();
      elements.taskInput.value = taskText;
      elements.addTaskBtn.click();
    }
    resetVoiceButton();
  };

  recognition.onerror = () => {
    resetVoiceButton();
  };

  function resetVoiceButton() {
    elements.voiceBtn.textContent = "🎤 Voice Command";
    elements.voiceBtn.style.backgroundColor = "#1abc9c";
  }
}

// Task Management
function editTask(li, task) {
  elements.taskInput.value = task.text;
  elements.categoryInput.value = task.category;
  elements.priorityInput.value = task.priority;
  elements.dueDateInput.value = task.dueDate;

  // Set dependencies
  updateDependencyDropdown();
  if (task.dependsOn?.length) {
    task.dependsOn.forEach(depId => {
      const option = Array.from(elements.dependencyInput.options)
        .find(opt => parseInt(opt.value) === depId);
      if (option) option.selected = true;
    });
  }

  elements.addTaskBtn.textContent = 'Save Changes';
  const originalClick = elements.addTaskBtn.onclick;
  
  elements.addTaskBtn.onclick = () => {
    const selectedDependencies = Array.from(elements.dependencyInput.selectedOptions)
      .map(option => parseInt(option.value))
      .filter(id => !isNaN(id));

    const updatedTask = {
      ...task,
      text: elements.taskInput.value.trim(),
      category: elements.categoryInput.value,
      priority: elements.priorityInput.value,
      dueDate: elements.dueDateInput.value,
      dependsOn: selectedDependencies
    };

    if (updatedTask.text) {
      li.remove();
      addTaskToDOM(updatedTask);
      state.tasks = state.tasks.map(t => t.id === task.id ? updatedTask : t);
      saveTasks();
      resetForm();
      elements.addTaskBtn.onclick = originalClick;
      updateDependentTasks(task.id);
    }
  };
}

function deleteTask(li, taskId) {
  if (li.classList.contains('completed')) state.completedTasks--;
  li.remove();
  state.tasks = state.tasks.filter(task => task.id !== taskId);
  state.totalTasks--;
  
  // Update any tasks that depended on this one
  state.tasks.forEach(t => {
    if (t.dependsOn?.includes(taskId)) {
      t.dependsOn = t.dependsOn.filter(id => id !== taskId);
    }
  });
  
  updateTaskCount();
  saveTasks();
  updateDependencyDropdown();
}

function toggleTaskCompletion(li, task) {
  // Check if task can be completed
  const blockers = checkDependencies(task);
  if (blockers.hasBlockers && !task.completed) {
    alert(`Cannot complete this task yet. ${blockers.blockerCount} dependency${blockers.blockerCount !== 1 ? 's' : ''} remaining.`);
    return;
  }

  li.classList.toggle('completed');
  task.completed = !task.completed;
  
  if (task.completed) {
    state.completedTasks++;
    li.classList.remove('overdue');
  } else {
    state.completedTasks--;
    if (isOverdue(task.dueDate)) li.classList.add('overdue');
  }
  
  // Update dependent tasks
  updateDependentTasks(task.id);
  updateTaskCount();
  saveTasks();
  updateDependencyDropdown();
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
  updateDependencyDropdown();
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

// Utility Functions
function updateTaskCount() {
  elements.taskCount.textContent = `${state.completedTasks} of ${state.totalTasks} tasks completed`;
  renderProgressChart();
}

function resetForm() {
  elements.taskInput.value = '';
  elements.categoryInput.value = 'Personal';
  elements.priorityInput.value = 'Low';
  elements.dueDateInput.value = '';
  elements.dependencyInput.innerHTML = '<option value="" disabled selected>Select dependencies</option>';
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
  updateDependencyDropdown();
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
init();g