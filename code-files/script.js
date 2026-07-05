 (function() {
    "use strict";

    // ----- Visitor counter logic (localStorage based) -----
    const STORAGE_KEY_TOTAL = 'visitor_total_count';
    const STORAGE_KEY_UNIQUE = 'visitor_unique_ip_count';
    const STORAGE_KEY_LAST_VISIT = 'visitor_last_visit_ts';
    const DEVICE_ID_KEY = 'visitor_device_id';
    const SEEN_DEVICES_KEY = 'visitor_seen_devices';

    let totalVisits = parseInt(localStorage.getItem(STORAGE_KEY_TOTAL), 10) || 0;
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = 'dev_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }

    let seenDevices = localStorage.getItem(SEEN_DEVICES_KEY);
    let seenSet = seenDevices ? new Set(JSON.parse(seenDevices)) : new Set();
    const isNewDevice = !seenSet.has(deviceId);

    totalVisits += 1;
    localStorage.setItem(STORAGE_KEY_TOTAL, totalVisits.toString());

    if (isNewDevice) {
      seenSet.add(deviceId);
      localStorage.setItem(SEEN_DEVICES_KEY, JSON.stringify(Array.from(seenSet)));
    }
    const uniqueIPs = seenSet.size;
    localStorage.setItem(STORAGE_KEY_UNIQUE, uniqueIPs.toString());

    const now = Date.now();
    const lastVisit = parseInt(localStorage.getItem(STORAGE_KEY_LAST_VISIT), 10) || now;
    localStorage.setItem(STORAGE_KEY_LAST_VISIT, now.toString());

    // Update DOM
    document.getElementById('totalVisitsDisplay').textContent = totalVisits;
    document.getElementById('uniqueIPsDisplay').textContent = uniqueIPs;
    document.getElementById('visitorCountBig').textContent = totalVisits;

    const lastVisitSpan = document.getElementById('lastVisitTime');
    if (lastVisitSpan) {
      const d = new Date(lastVisit);
      lastVisitSpan.textContent = d.toLocaleDateString('en-US', { 
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
      });
    }

    const todayChangeSpan = document.getElementById('todayChange');
    const todayDate = new Date(now).toDateString();
    const storedDate = localStorage.getItem('visitor_today_date');
    if (storedDate !== todayDate) {
      localStorage.setItem('visitor_today_count', '1');
      localStorage.setItem('visitor_today_date', todayDate);
      todayChangeSpan.textContent = '+1';
    } else {
      let todayCount = parseInt(localStorage.getItem('visitor_today_count'), 10) || 0;
      todayCount += 1;
      localStorage.setItem('visitor_today_count', todayCount.toString());
      todayChangeSpan.textContent = `+${todayCount}`;
    }

    document.getElementById('sessionNote').textContent = `🖥️ device · ${deviceId.slice(0, 6)}… · ${seenSet.size} unique IPs`;

    // ----- DIAGRAM MANAGEMENT (Admin-only via double-click) -----
    const diagramUpload = document.getElementById('diagramUpload');
    const uploadedImg = document.getElementById('uploadedDiagram');
    const placeholderContent = document.getElementById('placeholderContent');
    const removeBtn = document.getElementById('removeDiagramBtn');
    const uploadBtn = document.getElementById('uploadBtn');
    const diagramContainer = document.getElementById('diagramContainer');
    const adminControls = document.getElementById('adminControls');
    const adminStatus = document.getElementById('adminStatus');
    const secretHint = document.getElementById('secretHint');

    let isAdmin = false;

    // Function to show uploaded image
    function displayImage(file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        uploadedImg.src = e.target.result;
        uploadedImg.style.display = 'block';
        placeholderContent.style.display = 'none';
        // Store in localStorage so it persists
        try {
          localStorage.setItem('saved_diagram_image', e.target.result);
        } catch (err) {
          console.warn('Image too large for localStorage, will reset on refresh');
        }
      };
      reader.readAsDataURL(file);
    }

    // Function to remove image
    function removeDiagram() {
      uploadedImg.src = '';
      uploadedImg.style.display = 'none';
      placeholderContent.style.display = 'block';
      localStorage.removeItem('saved_diagram_image');
      diagramUpload.value = '';
    }

    // Load saved image if exists
    function loadSavedDiagram() {
      const saved = localStorage.getItem('saved_diagram_image');
      if (saved) {
        uploadedImg.src = saved;
        uploadedImg.style.display = 'block';
        placeholderContent.style.display = 'none';
      }
    }
    loadSavedDiagram();

    // ----- SECRET ADMIN UNLOCK: Double-click on diagram container -----
    diagramContainer.addEventListener('dblclick', function(e) {
      // Toggle admin mode
      isAdmin = !isAdmin;
      
      if (isAdmin) {
        adminControls.classList.add('visible');
        adminStatus.textContent = '🔓 admin mode';
        adminStatus.style.color = '#2a7de1';
        secretHint.textContent = '⚡ double-click to lock';
        // Enable upload via click on placeholder (if no image)
        if (placeholderContent.style.display !== 'none') {
          placeholderContent.style.cursor = 'pointer';
        }
        // Make container look editable
        diagramContainer.style.borderColor = '#2a7de1';
        diagramContainer.style.background = '#f0f7ff';
      } else {
        adminControls.classList.remove('visible');
        adminStatus.textContent = '🔒 view-only';
        adminStatus.style.color = '';
        secretHint.textContent = '⚡ double-click to admin';
        placeholderContent.style.cursor = 'default';
        diagramContainer.style.borderColor = '#dce6f0';
        diagramContainer.style.background = '#f8faff';
      }
    });

    // Upload button click (only works in admin mode)
    uploadBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      if (isAdmin) {
        diagramUpload.click();
      }
    });

    // File input change
    diagramUpload.addEventListener('change', function(e) {
      if (this.files && this.files[0] && isAdmin) {
        displayImage(this.files[0]);
        // Auto-lock after upload for security
        isAdmin = false;
        adminControls.classList.remove('visible');
        adminStatus.textContent = '🔒 view-only';
        adminStatus.style.color = '';
        secretHint.textContent = '⚡ double-click to admin';
        placeholderContent.style.cursor = 'default';
        diagramContainer.style.borderColor = '#dce6f0';
        diagramContainer.style.background = '#f8faff';
      }
    });

    // Remove button (only works in admin mode)
    removeBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      if (isAdmin) {
        removeDiagram();
        // Auto-lock after removal
        isAdmin = false;
        adminControls.classList.remove('visible');
        adminStatus.textContent = '🔒 view-only';
        adminStatus.style.color = '';
        secretHint.textContent = '⚡ double-click to admin';
        placeholderContent.style.cursor = 'default';
        diagramContainer.style.borderColor = '#dce6f0';
        diagramContainer.style.background = '#f8faff';
      }
    });

    // Click on placeholder when in admin mode to upload
    placeholderContent.addEventListener('click', function(e) {
      if (isAdmin) {
        diagramUpload.click();
      }
    });

    // ----- Extra: Live clock in footer -----
    const footer = document.querySelector('.diagram-footer');
    const clockSpan = document.createElement('span');
    clockSpan.style.marginLeft = 'auto';
    clockSpan.style.fontSize = '0.7rem';
    clockSpan.style.color = '#4b6a87';
    clockSpan.innerHTML = '<i class="far fa-clock"></i> ';
    const timeText = document.createTextNode('');
    clockSpan.appendChild(timeText);
    footer.appendChild(clockSpan);

    function updateClock() {
      const d = new Date();
      timeText.textContent = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    updateClock();
    setInterval(updateClock, 1000);

  })();