// Admin password (in a real application, this should be handled securely on the server)
const ADMIN_PASSWORD = 'wedding2025Hashemi';

// Login handling
function login() {
    const password = document.getElementById('passwordInput').value;
    if (password === ADMIN_PASSWORD) {
        document.getElementById('loginForm').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        loadResponses();
    } else {
        alert('رمز عبور اشتباه است.');
    }
}

// Load and display responses from Google Sheets
async function loadResponses() {
    try {
        // Fetch responses from Google Sheets web app
        const response = await fetch('https://script.google.com/macros/s/AKfycbywMC0gObdym8Fs5Ct5WtxbGIvUFhcjgpAO7ZFMqBOvUDTqrNbbL994J9oMVOMhSROgDw/exec?action=getResponses');
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'خطا در دریافت اطلاعات');
        }
        
        const responses = data.responses || [];
        
        // Update statistics
        updateStats(responses);
        
        // Update table
        const tbody = document.querySelector('#responsesTable tbody');
        tbody.innerHTML = '';
        
        responses.forEach(response => {
            const [firstName, lastName, message, timestamp, status, count] = response;
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${firstName} ${lastName}</td>
                <td>${status === 'Yes' ? 'حضور' : 'عدم حضور'}</td>
                <td>${count || 1}</td>
                <td>${message || '-'}</td>
                <td>${formatDate(timestamp)}</td>
                <td>
                    <button onclick="deleteResponse('${timestamp}')" class="delete-btn">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        // Update charts
        updateCharts(responses);
    } catch (error) {
        console.error('Error loading responses:', error);
        alert('خطا در دریافت اطلاعات');
    }
}

// Update statistics with real guest counts from Google Sheets
function updateStats(responses) {
    let totalGuests = 0;
    let acceptedGuests = 0;
    let declinedGuests = 0;
    
    responses.forEach(response => {
        const [,,, timestamp, status, guestCount] = response;
        const count = parseInt(guestCount) || 1;
        totalGuests += count;
        
        if (status === 'Yes') {
            acceptedGuests += count;
        } else if (status === 'No') {
            declinedGuests += count;
        }
    });
    
    document.getElementById('totalGuests').textContent = totalGuests;
    document.getElementById('acceptedGuests').textContent = acceptedGuests;
    document.getElementById('declinedGuests').textContent = declinedGuests;
    document.getElementById('pendingGuests').textContent = totalGuests - (acceptedGuests + declinedGuests);
}

// Delete response from Google Sheets
async function deleteResponse(timestamp) {
    if (confirm('آیا مطمئن هستید؟')) {
        try {
            // Delete from Google Sheets
            const response = await fetch(`https://script.google.com/macros/s/AKfycbywMC0gObdym8Fs5Ct5WtxbGIvUFhcjgpAO7ZFMqBOvUDTqrNbbL994J9oMVOMhSROgDw/exec?action=deleteResponse&timestamp=${timestamp}`);
            
            if (!response.ok) throw new Error('Failed to delete response');
            
            // Reload responses after successful deletion
            loadResponses();
        } catch (error) {
            console.error('Error deleting response:', error);
            alert('خطا در حذف پاسخ');
        }
    }
}

// Edit response from Google Sheets
async function editResponse(timestamp) {
    try {
        // Get response data from Google Sheets
        const response = await fetch(`https://script.google.com/macros/s/AKfycbywMC0gObdym8Fs5Ct5WtxbGIvUFhcjgpAO7ZFMqBOvUDTqrNbbL994J9oMVOMhSROgDw/exec?action=getResponse&timestamp=${timestamp}`);
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'خطا در دریافت اطلاعات');
        }
        
        const responseValue = data.response || [];
        
        // Show edit form
        const editForm = document.getElementById('editForm');
        editForm.style.display = 'block';
        
        // Fill form fields with response data
        const firstNameInput = document.getElementById('firstNameInput');
        const lastNameInput = document.getElementById('lastNameInput');
        const messageInput = document.getElementById('messageInput');
        const statusInput = document.getElementById('statusInput');
        const countInput = document.getElementById('countInput');
        
        firstNameInput.value = responseValue[0];
        lastNameInput.value = responseValue[1];
        messageInput.value = responseValue[2];
        statusInput.value = responseValue[4];
        countInput.value = responseValue[5];
        
        // Add event listener to save button
        const saveButton = document.getElementById('saveButton');
        saveButton.addEventListener('click', async () => {
            try {
                // Get form data
                const formData = {
                    firstName: firstNameInput.value,
                    lastName: lastNameInput.value,
                    message: messageInput.value,
                    status: statusInput.value,
                    count: countInput.value,
                    timestamp: timestamp
                };
                
                // Update response in Google Sheets
                const updateResponse = await fetch('https://script.google.com/macros/s/AKfycbywMC0gObdym8Fs5Ct5WtxbGIvUFhcjgpAO7ZFMqBOvUDTqrNbbL994J9oMVOMhSROgDw/exec?action=updateResponse', {
                    method: 'POST',
                    body: JSON.stringify(formData)
                });
                
                if (!updateResponse.ok) throw new Error('Failed to update response');
                
                // Reload responses after successful update
                loadResponses();
                
                // Hide edit form
                editForm.style.display = 'none';
            } catch (error) {
                console.error('Error updating response:', error);
                alert('خطا در به روز رسانی پاسخ');
            }
        });
    } catch (error) {
        console.error('Error editing response:', error);
        alert('خطا در ویرایش پاسخ');
    }
}

// Format date to Persian format
function formatDate(isoDate) {
    try {
        if (!isoDate) return '-';
        const timestamp = Date.parse(isoDate);
        if (isNaN(timestamp)) return isoDate;
        
        const date = new Date(timestamp);
        return new Intl.DateTimeFormat('fa-IR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    } catch (error) {
        console.error('Date formatting error:', error);
        return isoDate || '-';
    }
}

// Link generator
document.getElementById('linkGeneratorForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const nameInput = document.getElementById('nameInput').value;
    const details = document.getElementById('detailsInput').value;
    const guestCount = document.getElementById('guestCountInput').value;
    // Create the invitation URL with all parameters
    const baseUrl = 'https://imanno7.github.io/Wedding';
    const params = new URLSearchParams();
    params.set('name', `${nameInput}`);
    params.set('details', details);
    params.set('count', guestCount);
        
    const invitationUrl = `${baseUrl}?${params.toString()}`;
    debugger;
    
    const linkElement = document.getElementById('generatedLink');
    const linkContainer = document.getElementById('generatedLinkContainer');
    linkElement.value = invitationUrl;
    linkContainer.style.display = 'block';
    
    // Add to guest list immediately
    // Save new invitation to Google Sheets
    //try {
    //    const data = {
    //        firstName: firstName,
    //        lastName: lastName,
    //        details: details,
    //        count: guestCount,
    //        timestamp: new Date().toISOString(),
    //        status: 'pending'
    //    };
        
    //    await fetch('https://script.google.com/macros/s/AKfycbywMC0gObdym8Fs5Ct5WtxbGIvUFhcjgpAO7ZFMqBOvUDTqrNbbL994J9oMVOMhSROgDw/exec?action=addInvitation', {
    //        method: 'POST',
    //        body: JSON.stringify(data)
    //    });
        
    //    // Reload the guest list
    //    loadResponses();
    //} catch (error) {
    //    console.error('Error saving invitation:', error);
    //    alert('خطا در ذخیره دعوتنامه');
    //}
});

// Update charts
function updateCharts(responses) {
    if (!responses || !Array.isArray(responses) || responses.length === 0) {
        console.log('No responses to show in charts');
        return;
    }

    // Clear existing charts
    const attendanceCtx = document.getElementById('attendanceChart');
    const timelineCtx = document.getElementById('timelineChart');
    if (attendanceCtx.chart) attendanceCtx.chart.destroy();
    if (timelineCtx.chart) timelineCtx.chart.destroy();

    // Calculate attendance with guest counts
    const attendanceData = responses.reduce((acc, [,,, timestamp, status, count]) => {
        const guestCount = parseInt(count) || 1;
        if (status === 'Yes') {
            acc.attending += guestCount;
        } else if (status === 'No') {
            acc.notAttending += guestCount;
        }
        return acc;
    }, { attending: 0, notAttending: 0 });

    // Create attendance chart
    attendanceCtx.chart = new Chart(attendanceCtx, {
        type: 'pie',
        data: {
            labels: ['حضور', 'عدم حضور'],
            datasets: [{
                data: [attendanceData.attending, attendanceData.notAttending],
                backgroundColor: ['#4CAF50', '#f44336']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'وضعیت حضور مهمانان',
                    font: {
                        family: 'Noto Naskh Arabic'
                    }
                },
                legend: {
                    labels: {
                        font: {
                            family: 'Noto Naskh Arabic'
                        }
                    }
                }
            }
        }
    });

    // Create timeline chart
    const timelineData = processTimelineData(responses);
    
    timelineCtx.chart = new Chart(timelineCtx, {
        type: 'bar',
        data: {
            labels: timelineData.labels,
            datasets: [{
                label: 'تعداد مهمانان',
                data: timelineData.data,
                backgroundColor: '#B8860B'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'روند پاسخ‌ها در طول زمان',
                    font: {
                        family: 'Noto Naskh Arabic'
                    }
                },
                legend: {
                    labels: {
                        font: {
                            family: 'Noto Naskh Arabic'
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        font: {
                            family: 'Noto Naskh Arabic'
                        }
                    }
                },
                x: {
                    ticks: {
                        font: {
                            family: 'Noto Naskh Arabic'
                        }
                    }
                }
            }
        }
    });
}

// Process timeline data
function processTimelineData(responses) {
    const dates = responses.map(response => response[3].split('T')[0]);
    const uniqueDates = [...new Set(dates)];
    uniqueDates.sort((a, b) => new Date(a) - new Date(b));

    const data = uniqueDates.map(date => {
        const responsesOnDate = responses.filter(response => response[3].startsWith(date));
        const totalGuests = responsesOnDate.reduce((sum, [,,,,, count]) => sum + (parseInt(count) || 1), 0);
        return totalGuests;
    });

    return {
        labels: uniqueDates.map(d => new Date(d).toLocaleDateString('fa-IR')),
        data: data
    };
}

// Initialize charts when DOM is loaded
// Search functionality
function searchResponses(searchTerm) {
    const rows = document.querySelectorAll('#responsesTable tbody tr');
    searchTerm = searchTerm.toLowerCase();

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// Export to Excel function
function exportToExcel() {
    try {
        const table = document.getElementById('responsesTable');
        if (!table) return;

        const rows = Array.from(table.querySelectorAll('tr'));
        let csvContent = '\uFEFF'; // Add BOM for proper UTF-8 encoding

        rows.forEach(row => {
            const cells = Array.from(row.querySelectorAll('th, td'));
            const rowData = cells
                .map(cell => {
                    // Remove action buttons from export
                    if (cell.querySelector('button')) return '';
                    return `"${cell.textContent.replace(/"/g, '""').trim()}"`;
                })
                .join(',');
            csvContent += rowData + '\r\n';
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `guest-list-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Error exporting to Excel:', error);
        alert('خطا در ایجاد فایل اکسل');
    }
}

// Print function
function printGuestList() {
    window.print();
}

// Share and copy link functions
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('لینک با موفقیت کپی شد!');
    }).catch(err => {
        console.error('Error copying text:', err);
        alert('خطا در کپی کردن لینک');
    });
}

function shareOnWhatsApp(url, text) {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text + '\n' + url)}`;
    window.open(whatsappUrl, '_blank');
}

function shareOnTelegram(url, text) {
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    window.open(telegramUrl, '_blank');
}

function shareOnInstagram(url, text) {
    // Since Instagram doesn't have a direct share URL, we'll copy to clipboard
    copyToClipboard(text + '\n' + url);
    alert('لینک کپی شد. لطفاً آن را در اینستاگرام به اشتراک بگذارید.');
    window.open('https://instagram.com', '_blank');
}

// Initialize link generator form
function initializeLinkGenerator() {
    const form = document.getElementById('linkGeneratorForm');
    const container = document.getElementById('generatedLinkContainer');
    const linkInput = document.getElementById('generatedLink');

    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            //const nameInput = document.getElementById('nameInput').value;
            //const details = document.getElementById('detailsInput').value;
            //const count = document.getElementById('guestCountInput').value;
            
            //// Use the current URL to determine the base URL
            //const currentUrl = window.location.href;
            //const baseUrl = currentUrl.split('/admin.html')[0];
            
            //// Generate the link with name, details, and count parameters
            //const link = `${baseUrl}/?name=${encodeURIComponent(nameInput)}&details=${encodeURIComponent(details)}&count=${count}`;
            
            //if (container) container.style.display = 'block';
            //if (linkInput) linkInput.value = link;
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Add search event listener
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => searchResponses(e.target.value));
    }

    // Add event listeners for action buttons
    const exportExcelBtn = document.getElementById('exportExcel');
    if (exportExcelBtn) {
        exportExcelBtn.addEventListener('click', exportToExcel);
    }

    const printListBtn = document.getElementById('printList');
    if (printListBtn) {
        printListBtn.addEventListener('click', printGuestList);
    }

    // Initialize link generator
    initializeLinkGenerator();

    // Add event listeners for share buttons
    const copyLinkBtn = document.getElementById('copyLink');
    if (copyLinkBtn) {
        copyLinkBtn.addEventListener('click', () => {
            const linkInput = document.getElementById('generatedLink');
            if (linkInput) {
                copyToClipboard(linkInput.value);
            }
        });
    }

    const shareWhatsappBtn = document.getElementById('shareWhatsapp');
    if (shareWhatsappBtn) {
        shareWhatsappBtn.addEventListener('click', () => {
            const linkInput = document.getElementById('generatedLink');
            if (linkInput) {
                shareOnWhatsApp(linkInput.value, 'دعوت به مراسم عروسی');
            }
        });
    }

    const shareTelegramBtn = document.getElementById('shareTelegram');
    if (shareTelegramBtn) {
        shareTelegramBtn.addEventListener('click', () => {
            const linkInput = document.getElementById('generatedLink');
            if (linkInput) {
                shareOnTelegram(linkInput.value, 'دعوت به مراسم عروسی');
            }
        });
    }

    const shareInstagramBtn = document.getElementById('shareInstagram');
    if (shareInstagramBtn) {
        shareInstagramBtn.addEventListener('click', () => {
            const linkInput = document.getElementById('generatedLink');
            if (linkInput) {
                shareOnInstagram(linkInput.value, 'دعوت به مراسم عروسی');
            }
        });
    }

    // Create empty charts initially
    const attendanceCtx = document.getElementById('attendanceChart');
    const timelineCtx = document.getElementById('timelineChart');
    
    attendanceCtx.chart = new Chart(attendanceCtx, {
        type: 'pie',
        data: {
            labels: ['حضور', 'عدم حضور'],
            datasets: [{
                data: [0, 0],
                backgroundColor: ['#4CAF50', '#f44336']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'وضعیت حضور مهمانان',
                    font: {
                        family: 'Noto Naskh Arabic'
                    }
                },
                legend: {
                    labels: {
                        font: {
                            family: 'Noto Naskh Arabic'
                        }
                    }
                }
            }
        }
    });
    
    timelineCtx.chart = new Chart(timelineCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'تعداد پاسخ‌ها',
                data: [],
                backgroundColor: '#B8860B'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'روند پاسخ‌ها در طول زمان',
                    font: {
                        family: 'Noto Naskh Arabic'
                    }
                },
                legend: {
                    labels: {
                        font: {
                            family: 'Noto Naskh Arabic'
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        font: {
                            family: 'Noto Naskh Arabic'
                        }
                    }
                },
                x: {
                    ticks: {
                        font: {
                            family: 'Noto Naskh Arabic'
                        }
                    }
                }
            }
        }
    });
});
