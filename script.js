// Main Application Controller
const app = {
    // App State
    currentSection: 1,
    totalSections: 6,
    userData: {
        goals: {},
        routine: {},
        progress: {},
        completedSections: new Set()
    },

    // Initialize Application
    init() {
        this.setupEventListeners();
        this.loadUserData();
        this.renderCurrentSection();
        this.updateProgress();
        this.hideLoadingScreen();
        
        // Show welcome toast
        this.showToast('Welcome to your Success Planner! 🚀', 'success');
    },

    // Setup Event Listeners
    setupEventListeners() {
        // Mobile menu
        document.getElementById('mobileMenuBtn').addEventListener('click', () => {
            document.getElementById('sidebar').classList.add('active');
        });

        document.getElementById('closeSidebar').addEventListener('click', () => {
            document.getElementById('sidebar').classList.remove('active');
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', this.toggleTheme.bind(this));

        // Navigation items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const section = parseInt(e.currentTarget.dataset.section);
                this.jumpToSection(section);
                // Close mobile sidebar
                document.getElementById('sidebar').classList.remove('active');
            });
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                this.navigate(-1);
            } else if (e.key === 'ArrowRight') {
                this.navigate(1);
            }
        });

        // Auto-save on input changes
        document.addEventListener('input', this.debounce(() => {
            this.saveUserData();
        }, 1000));

        // Check for unsaved changes before leaving
        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges()) {
                e.preventDefault();
                e.returnValue = '';
            }
        });
    },

    // Navigation Methods
    navigate(direction) {
        const newSection = this.currentSection + direction;
        
        if (newSection >= 1 && newSection <= this.totalSections) {
            // Mark current section as completed
            this.userData.completedSections.add(this.currentSection);
            
            this.currentSection = newSection;
            this.renderCurrentSection();
            this.updateProgress();
            this.updateNavigation();
            this.saveUserData();

            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // Special handling for last section
        if (this.currentSection === this.totalSections) {
            this.showCompletionCelebration();
        }
    },

    jumpToSection(sectionNumber) {
        if (sectionNumber >= 1 && sectionNumber <= this.totalSections) {
            this.userData.completedSections.add(this.currentSection);
            this.currentSection = sectionNumber;
            this.renderCurrentSection();
            this.updateProgress();
            this.updateNavigation();
            this.saveUserData();
        }
    },

    updateNavigation() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const currentSectionEl = document.getElementById('currentSection');

        prevBtn.disabled = this.currentSection === 1;
        currentSectionEl.textContent = this.currentSection;

        // Update next button text on last section
        if (this.currentSection === this.totalSections) {
            nextBtn.innerHTML = 'Complete <i class="fas fa-flag-checkered"></i>';
            nextBtn.onclick = () => this.completeProgram();
        } else {
            nextBtn.innerHTML = 'Next <i class="fas fa-arrow-right"></i>';
            nextBtn.onclick = () => this.navigate(1);
        }

        // Update navigation items
        document.querySelectorAll('.nav-item').forEach((item, index) => {
            const sectionNum = index + 1;
            item.classList.toggle('active', sectionNum === this.currentSection);
            item.classList.toggle('completed', this.userData.completedSections.has(sectionNum));
        });
    },

    // Section Rendering
    renderCurrentSection() {
        const container = document.getElementById('contentContainer');
        const section = sections[this.currentSection - 1];
        
        if (section) {
            container.innerHTML = section.getHTML();
            this.updateCurrentSectionTitle(section.title);
            
            // Initialize section-specific functionality
            if (section.init) {
                section.init();
            }
        }
    },

    updateCurrentSectionTitle(title) {
        document.getElementById('currentSectionTitle').textContent = title;
    },

    // Progress Tracking
    updateProgress() {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        const completedSectionsEl = document.getElementById('completedSections');
        const completedActivitiesEl = document.getElementById('completedActivities');

        const progress = (this.userData.completedSections.size / this.totalSections) * 100;
        const completedActivities = this.countCompletedActivities();

        progressFill.style.width = `${progress}%`;
        progressText.textContent = `${Math.round(progress)}% Complete`;
        completedSectionsEl.textContent = this.userData.completedSections.size;
        completedActivitiesEl.textContent = completedActivities;
    },

    countCompletedActivities() {
        let count = 0;
        // Count checked checkboxes in current section
        const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
        count += checkboxes.length;
        
        // Count form completions
        if (this.userData.goals.mainGoal) count++;
        if (Object.keys(this.userData.routine).length > 0) count++;
        
        return count;
    },

    // Data Management
    saveUserData() {
        // Collect form data
        this.collectFormData();
        
        // Save to localStorage
        localStorage.setItem('successPlannerData', JSON.stringify({
            ...this.userData,
            completedSections: Array.from(this.userData.completedSections)
        }));
    },

    loadUserData() {
        const saved = localStorage.getItem('successPlannerData');
        if (saved) {
            const data = JSON.parse(saved);
            this.userData = {
                ...data,
                completedSections: new Set(data.completedSections || [])
            };
            this.showToast('Your progress has been loaded! 📚', 'success');
        }
    },

    collectFormData() {
        // Goal planning data
        if (document.getElementById('mainGoal')) {
            this.userData.goals = {
                mainGoal: document.getElementById('mainGoal').value,
                timeline: document.getElementById('timeline').value,
                objectives: document.getElementById('objectives').value,
                motivation: document.getElementById('motivation').value
            };
        }

        // Routine data
        if (document.getElementById('wakeUpTime')) {
            const routineActivities = [];
            document.querySelectorAll('#routineBody tr').forEach(row => {
                const time = row.cells[0].textContent;
                const activity = row.cells[1].textContent;
                const completed = row.cells[2].querySelector('input').checked;
                routineActivities.push({ time, activity, completed });
            });
            
            this.userData.routine = {
                wakeUpTime: document.getElementById('wakeUpTime').value,
                activities: routineActivities
            };
        }
    },

    hasUnsavedChanges() {
        // Implement logic to check for unsaved changes
        return false; // Simplified for example
    },

    // Goal Planning Methods
    saveGoalPlan() {
        this.collectFormData();
        
        // Show goal display
        const goalDisplay = document.getElementById('goalDisplay');
        if (goalDisplay) {
            goalDisplay.style.display = 'block';
            document.getElementById('displayGoal').textContent = this.userData.goals.mainGoal;
            document.getElementById('displayTimeline').textContent = this.userData.goals.timeline;
            document.getElementById('displayObjectives').textContent = this.userData.goals.objectives;
            document.getElementById('displayMotivation').textContent = this.userData.goals.motivation;
        }
        
        this.showToast('Goal plan saved successfully! 🎯', 'success');
        this.userData.completedSections.add(4); // Goal setting section
        this.updateProgress();
    },

    // Routine Planning Methods
    generateRoutineTable() {
        const routineBody = document.getElementById('routineBody');
        const wakeUpTime = document.getElementById('wakeUpTime').value;
        
        const defaultActivities = [
            { time: this.addTime(wakeUpTime, 0), activity: 'Wake up & Morning Routine' },
            { time: this.addTime(wakeUpTime, 60), activity: 'Breakfast' },
            { time: this.addTime(wakeUpTime, 120), activity: 'Morning Study Session' },
            { time: this.addTime(wakeUpTime, 180), activity: 'Short Break' },
            { time: this.addTime(wakeUpTime, 195), activity: 'Second Study Session' },
            { time: this.addTime(wakeUpTime, 255), activity: 'Lunch Break' },
            { time: this.addTime(wakeUpTime, 315), activity: 'Afternoon Study Session' },
            { time: this.addTime(wakeUpTime, 375), activity: 'Exercise or Walk' },
            { time: this.addTime(wakeUpTime, 420), activity: 'Free Time / Hobbies' },
            { time: this.addTime(wakeUpTime, 480), activity: 'Dinner' },
            { time: this.addTime(wakeUpTime, 540), activity: 'Review Day & Plan Tomorrow' },
            { time: this.addTime(wakeUpTime, 600), activity: 'Wind Down & Relax' },
            { time: this.addTime(wakeUpTime, 660), activity: 'Sleep' }
        ];

        let html = '';
        defaultActivities.forEach((activity, index) => {
            const savedActivity = this.userData.routine.activities?.[index];
            html += `
                <tr>
                    <td>${savedActivity?.time || activity.time}</td>
                    <td>${savedActivity?.activity || activity.activity}</td>
                    <td>
                        <input type="checkbox" ${savedActivity?.completed ? 'checked' : ''} 
                               onchange="app.updateProgress()">
                    </td>
                </tr>
            `;
        });
        routineBody.innerHTML = html;
    },

    addTime(timeString, minutesToAdd) {
        const [hours, minutes] = timeString.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes + minutesToAdd, 0, 0);
        
        return date.toTimeString().slice(0, 5);
    },

    addCustomActivity() {
        const newActivity = document.getElementById('newActivity').value;
        const activityTime = document.getElementById('activityTime').value;

        if (!newActivity || !activityTime) {
            this.showToast('Please enter both activity and time! ⚠️', 'warning');
            return;
        }

        const routineBody = document.getElementById('routineBody');
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${activityTime}</td>
            <td>${newActivity}</td>
            <td><input type="checkbox" onchange="app.updateProgress()"></td>
        `;
        routineBody.appendChild(row);

        // Clear inputs
        document.getElementById('newActivity').value = '';
        document.getElementById('activityTime').value = '';
        
        this.showToast('Activity added to your routine! ✅', 'success');
    },

    saveRoutine() {
        this.collectFormData();
        this.showToast('Daily routine saved successfully! 📅', 'success');
        this.userData.completedSections.add(5); // Routine section
        this.updateProgress();
    },

    resetRoutine() {
        if (confirm('Are you sure you want to reset to the default routine?')) {
            this.generateRoutineTable();
            this.showToast('Routine reset to default! 🔄', 'info');
        }
    },

    // Utility Methods
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Theme Management
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        document.getElementById('themeToggle').innerHTML = 
            newTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        
        localStorage.setItem('theme', newTheme);
        this.showToast(`Switched to ${newTheme} theme! 🌗`, 'info');
    },

    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        document.getElementById('themeToggle').innerHTML = 
            savedTheme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    },

    // Text-to-Speech
    readCurrentSection() {
        const section = document.querySelector('.content-section');
        const text = section?.textContent || '';
        
        if ('speechSynthesis' in window) {
            const speech = new SpeechSynthesisUtterance();
            speech.text = text.substring(0, 1000); // Limit length
            speech.rate = 0.8;
            speech.pitch = 1;
            
            window.speechSynthesis.speak(speech);
            this.showToast('Reading section aloud... 🔊', 'info');
        } else {
            this.showToast('Text-to-speech not supported in your browser ⚠️', 'warning');
        }
    },

    stopReading() {
        window.speechSynthesis.cancel();
        this.showToast('Stopped reading ⏹️', 'info');
    },

    // Export Functionality
    exportData() {
        const data = {
            ...this.userData,
            exportedAt: new Date().toISOString(),
            completedSections: Array.from(this.userData.completedSections)
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `success-planner-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        this.showToast('Data exported successfully! 📤', 'success');
    },

    // UI Feedback Methods
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${this.getToastIcon(type)}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            toast.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    },

    getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            warning: 'exclamation-triangle',
            error: 'times-circle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    },

    hideLoadingScreen() {
        setTimeout(() => {
            document.getElementById('loadingScreen').style.opacity = '0';
            setTimeout(() => {
                document.getElementById('loadingScreen').style.display = 'none';
            }, 500);
        }, 1000);
    },

    showCompletionCelebration() {
        if (this.userData.completedSections.size === this.totalSections) {
            this.showToast('🎉 Congratulations! You completed the Success Planner!', 'success');
        }
    },

    completeProgram() {
        this.userData.completedSections.add(this.totalSections);
        this.saveUserData();
        this.showToast('🎊 Amazing! Your success journey begins now!', 'success');
        
        // Show completion modal or redirect
        setTimeout(() => {
            alert('Program Completed! 🏆\n\nYou now have all the tools for success. Remember to review your goals and routine regularly!');
        }, 1000);
    },

    printRoutine() {
        window.print();
    }
};

// Section Data and Templates
const sections = [
    {
        title: "Your \"And Then What?\" Moment",
        getHTML: () => `
            <section class="content-section fade-in">
                <div class="section-header">
                    <div class="section-icon">
                        <i class="fas fa-bullseye"></i>
                    </div>
                    <h2>Your "And Then What?" Moment</h2>
                </div>
                <div class="content-body">
                    <p>You've studied hard, passed your exams, and you're here. But as you stand on this launchpad, I want to ask you a very personal question: <strong>‘And then what?’</strong></p>
                    
                    <div class="video-container">
                        <iframe src="https://www.youtube.com/embed/s6T1pKk6eb8" title="Goal Setting for Students" allowfullscreen></iframe>
                        <div class="video-caption">How to set meaningful goals for your academic and professional journey</div>
                    </div>

                    <p>You get to campus... <em>and then what?</em> You face your first university-level exam... <em>and then what?</em> You feel overwhelmed and lonely... <em>and then what?</em></p>
                    
                    <div class="quote">
                        "The path ahead is not a straight line. It's a journey with incredible highs and challenging lows."
                    </div>

                    <p>Today, we're not talking about <em>what</em> you're going to study, but <strong>who you need to become</strong> to thrive through all of it. This is about your two most important personal superpowers: <strong>Resilience</strong> and <strong>Discipline</strong>.</p>
                </div>
            </section>
        `
    },
    {
        title: "Resilience: Your Personal Ability to Bounce Forward",
        getHTML: () => `
            <section class="content-section">
                <div class="section-header">
                    <div class="section-icon">
                        <i class="fas fa-fist-raised"></i>
                    </div>
                    <h2>Resilience: Your Personal Ability to Bounce Forward</h2>
                </div>
                <div class="content-body">
                    <p><strong>Your New Relationship with Failure:</strong> Let's be honest: you will face setbacks. Resilience isn't about avoiding these moments; it's about how you talk to yourself when they happen.</p>
                    
                    <div class="video-container">
                        <iframe src="https://www.youtube.com/embed/Ho4nD5kUHso" title="Building Resilience" allowfullscreen></iframe>
                        <div class="video-caption">Practical strategies to build resilience and overcome challenges</div>
                    </div>

                    <div class="tool-card">
                        <h4><i class="fas fa-tools"></i> Your Practical Tool: The Learning Reflection</h4>
                        <p>When you hit a wall, don't just shut down. Ask yourself:</p>
                        <ol>
                            <li><strong>What exactly happened?</strong> (e.g., "I failed my first calculus quiz.")</li>
                            <li><strong>What is this teaching me?</strong> (e.g., "My high school study habits aren't enough.")</li>
                            <li><strong>What is one small step I will take now?</strong> (e.g., "I will find a study partner this week.")</li>
                        </ol>
                    </div>

                    <p><strong>Find Your Personal "Why":</strong> Your 'Why' is your anchor. Why are you doing this? Write it down. Keep it close. Let it be the fire that keeps you going on the hard days.</p>
                </div>
            </section>
        `
    },
    {
        title: "Discipline: Your Personal Engine for Freedom",
        getHTML: () => `
            <section class="content-section">
                <div class="section-header">
                    <div class="section-icon">
                        <i class="fas fa-clock"></i>
                    </div>
                    <h2>Discipline: Your Personal Engine for Freedom</h2>
                </div>
                <div class="content-body">
                    <p><strong>Discipline = Your Personal Freedom:</strong> The discipline to study during the week gives you the freedom to enjoy your weekend without stress or guilt.</p>
                    
                    <div class="video-container">
                        <iframe src="https://www.youtube.com/embed/i3xw3Lo22kA" title="Time Management for Students" allowfullscreen></iframe>
                        <div class="video-caption">Effective time management techniques for academic success</div>
                    </div>

                    <div class="tool-card">
                        <h4><i class="fas fa-cogs"></i> Build Your Personal System</h4>
                        <p><strong>Focus Sprints:</strong> Use a timer. Give one task your full focus for just 25 minutes—phone away, notifications off. Then, a 5-minute break.</p>
                        <p><strong>You are the CEO of Your Time:</strong> Schedule your day. Block out time for lectures, studies, meals, and rest.</p>
                        <p><strong>Your One Most Important Thing:</strong> Each morning, ask: "What is the ONE thing I can do today that will make everything else easier?"</p>
                    </div>
                </div>
            </section>
        `
    },
    {
        title: "Your Personal Success Plan",
        getHTML: () => `
            <section class="content-section">
                <div class="section-header">
                    <div class="section-icon">
                        <i class="fas fa-tasks"></i>
                    </div>
                    <h2>Your Personal Success Plan</h2>
                </div>
                <div class="content-body">
                    <p>Now, let's create your personalized roadmap to success. Define your goals, set clear objectives, and build a daily routine that will get you there.</p>

                    <div class="goal-form">
                        <h3><i class="fas fa-bullseye"></i> Define Your Goals & Objectives</h3>
                        
                        <div class="form-group">
                            <label for="mainGoal">Main Goal (What do you want to achieve?)</label>
                            <input type="text" id="mainGoal" class="form-control" 
                                   placeholder="e.g., Graduate with First Class Honors in Computer Science"
                                   value="${app.userData.goals.mainGoal || ''}">
                        </div>

                        <div class="form-group">
                            <label for="timeline">Timeline</label>
                            <input type="text" id="timeline" class="form-control" 
                                   placeholder="e.g., 4 years, by May 2027"
                                   value="${app.userData.goals.timeline || ''}">
                        </div>

                        <div class="form-group">
                            <label for="objectives">Key Objectives (Break down your goal into smaller steps)</label>
                            <textarea id="objectives" class="form-control" placeholder="e.g., 
1. Maintain 3.8 GPA each semester
2. Complete 2 internships in tech companies
3. Build 3 portfolio projects
4. Join tech clubs and networking events">${app.userData.goals.objectives || ''}</textarea>
                        </div>

                        <div class="form-group">
                            <label for="motivation">Why is this important to you?</label>
                            <textarea id="motivation" class="form-control" 
                                      placeholder="Describe what drives you to achieve this goal...">${app.userData.goals.motivation || ''}</textarea>
                        </div>

                        <button class="btn btn-success" onclick="app.saveGoalPlan()">
                            <i class="fas fa-save"></i> Save My Goal Plan
                        </button>
                    </div>

                    <div class="goal-display" id="goalDisplay" style="${app.userData.goals.mainGoal ? 'display: block;' : 'display: none;'}">
                        <h4><i class="fas fa-check-circle"></i> Your Goal Plan</h4>
                        <p><strong>Goal:</strong> <span id="displayGoal">${app.userData.goals.mainGoal || ''}</span></p>
                        <p><strong>Timeline:</strong> <span id="displayTimeline">${app.userData.goals.timeline || ''}</span></p>
                        <p><strong>Objectives:</strong> <span id="displayObjectives">${app.userData.goals.objectives || ''}</span></p>
                        <p><strong>Motivation:</strong> <span id="displayMotivation">${app.userData.goals.motivation || ''}</span></p>
                    </div>
                </div>
            </section>
        `,
        init: function() {
            // Initialize goal form with saved data
            if (app.userData.goals.mainGoal) {
                document.getElementById('goalDisplay').style.display = 'block';
            }
        }
    },
    {
        title: "Your Daily Success Routine",
        getHTML: () => `
            <section class="content-section">
                <div class="section-header">
                    <div class="section-icon">
                        <i class="fas fa-calendar-alt"></i>
                    </div>
                    <h2>Your Daily Success Routine</h2>
                </div>
                <div class="content-body">
                    <p>Build a daily routine that supports your objectives. Consistency is key to achieving your goals.</p>

                    <div class="video-container">
                        <iframe src="https://www.youtube.com/embed/iONDebHX9qk" title="Productive Morning Routine" allowfullscreen></iframe>
                        <div class="video-caption">How to create a productive daily routine for success</div>
                    </div>

                    <div class="routine-planner">
                        <h3><i class="fas fa-pencil-alt"></i> Design Your Ideal Day</h3>
                        
                        <div class="form-group">
                            <label for="wakeUpTime">Wake-up Time</label>
                            <input type="time" id="wakeUpTime" class="form-control" 
                                   value="${app.userData.routine.wakeUpTime || '06:00'}" 
                                   onchange="app.generateRoutineTable()">
                        </div>

                        <table class="routine-table">
                            <thead>
                                <tr>
                                    <th>Time</th>
                                    <th>Activity</th>
                                    <th>Completed</th>
                                </tr>
                            </thead>
                            <tbody id="routineBody">
                                <!-- Routine will be generated by JavaScript -->
                            </tbody>
                        </table>

                        <div class="form-group">
                            <label for="newActivity">Add Custom Activity</label>
                            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                                <input type="text" id="newActivity" class="form-control" placeholder="e.g., Study Calculus">
                                <input type="time" id="activityTime" class="form-control">
                                <button class="btn btn-success" onclick="app.addCustomActivity()">Add</button>
                            </div>
                        </div>

                        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                            <button class="btn btn-success" onclick="app.saveRoutine()">
                                <i class="fas fa-save"></i> Save My Routine
                            </button>
                            <button class="btn btn-warning" onclick="app.printRoutine()">
                                <i class="fas fa-print"></i> Print Routine
                            </button>
                            <button class="btn btn-outline" onclick="app.resetRoutine()">
                                <i class="fas fa-redo"></i> Reset to Default
                            </button>
                        </div>
                    </div>

                    <div class="tool-card">
                        <h4><i class="fas fa-lightbulb"></i> Routine Building Tips</h4>
                        <ul>
                            <li>Start with 3-4 key activities and build from there</li>
                            <li>Include breaks and self-care time</li>
                            <li>Be consistent but flexible - adjust as needed</li>
                            <li>Track your progress and celebrate small wins</li>
                        </ul>
                    </div>
                </div>
            </section>
        `,
        init: function() {
            app.generateRoutineTable();
        }
    },
    {
        title: "Launch Your Success Journey",
        getHTML: () => `
            <section class="content-section">
                <div class="section-header">
                    <div class="section-icon">
                        <i class="fas fa-rocket"></i>
                    </div>
                    <h2>Launch Your Success Journey</h2>
                </div>
                <div class="content-body">
                    <div class="action-plan">
                        <h4><i class="fas fa-flag"></i> Your Commitment Starts Today</h4>
                        <p>Make these personal promises to yourself:</p>
                        <ul class="checklist">
                            <li>
                                <input type="checkbox" id="promise1">
                                <label for="promise1"><strong>I will embrace the stumbles.</strong> Every setback is a setup for a smarter comeback.</label>
                            </li>
                            <li>
                                <input type="checkbox" id="promise2">
                                <label for="promise2"><strong>I will own my time.</strong> I am the boss of my schedule, focus, and habits.</label>
                            </li>
                            <li>
                                <input type="checkbox" id="promise3">
                                <label for="promise3"><strong>I will follow my success plan.</strong> I commit to my goals and daily routine.</label>
                            </li>
                        </ul>
                    </div>

                    <div class="video-container">
                        <iframe src="https://www.youtube.com/embed/Wa5cB7vdEow" title="Staying Motivated" allowfullscreen></iframe>
                        <div class="video-caption">How to stay motivated and committed to your goals</div>
                    </div>

                    <div class="quote">
                        "You have the intelligence and the talent. Now, it's about building the inner strength to match. The world is waiting for your contribution."
                    </div>

                    <p><strong>Your first step starts now.</strong> Review your goal plan and routine, and begin implementing them today.</p>

                    <div style="text-align: center; margin-top: 30px;">
                        <button class="btn btn-success pulse" onclick="app.completeProgram()">
                            <i class="fas fa-flag-checkered"></i> Complete My Success Program
                        </button>
                    </div>
                </div>
            </section>
        `
    }
];

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    app.init();
    app.loadTheme();
});

// Export app for global access
window.app = app;