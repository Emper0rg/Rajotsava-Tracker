document.addEventListener("DOMContentLoaded", () => {
    // ---------------------------------------------
    // 1. Amount selection chips
    // ---------------------------------------------
    document.querySelectorAll('[data-amt]').forEach(b => {
        b.onclick = () => {
            const amtInput = document.getElementById('amount');
            if (amtInput) amtInput.value = b.dataset.amt;
            document.querySelectorAll('[data-amt]').forEach(x => x.classList.toggle('on', x === b));
        };
    });

    // ---------------------------------------------
    // 2. Contribute Flow & Student Verification
    // ---------------------------------------------
    const btnStartContribute = document.getElementById('btn-start-contribute');
    const contributeStartWrapper = document.getElementById('contribute-start-wrapper');
    const contributeWizard = document.getElementById('contribute-wizard');

    if (btnStartContribute && contributeWizard) {
        btnStartContribute.onclick = () => {
            contributeWizard.style.display = 'block';
            if (contributeStartWrapper) contributeStartWrapper.style.display = 'none';
            contributeWizard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        };
    }

    const selectYear = document.getElementById('select-year');
    const selectSection = document.getElementById('select-section');
    const selectUsn = document.getElementById('select-usn');
    const usnLoading = document.getElementById('usn-loading');
    const btnConfirmStudent = document.getElementById('btn-confirm-student');
    const studentVerifiedCard = document.getElementById('student-verified-card');
    const btnChangeStudent = document.getElementById('btn-change-student');
    const dispStudentName = document.getElementById('disp-student-name');
    const dispStudentMeta = document.getElementById('disp-student-meta');

    const paymentSection = document.getElementById('payment-section');
    const formStudentId = document.getElementById('form-student-id');
    const formStudentSummary = document.getElementById('form-student-summary');
    const crQrImg = document.getElementById('cr-qr-img');
    const crQrDownload = document.getElementById('cr-qr-download');
    const qrClassBadge = document.getElementById('qr-class-badge');

    let currentStudentsList = [];

    const loadClassStudents = () => {
        if (!selectYear || !selectSection || !selectUsn) return;
        const year = selectYear.value;
        const section = selectSection.value;

        if (!year || !section) {
            selectUsn.disabled = true;
            selectUsn.innerHTML = '<option value="">-- Choose Year & Section first --</option>';
            if (btnConfirmStudent) btnConfirmStudent.disabled = true;
            return;
        }

        if (usnLoading) usnLoading.style.display = 'block';
        selectUsn.disabled = true;
        selectUsn.innerHTML = '<option value="">Loading students…</option>';

        fetch(`/api/students?year=${encodeURIComponent(year)}&section=${encodeURIComponent(section)}`)
            .then(res => res.json())
            .then(data => {
                currentStudentsList = data;
                if (usnLoading) usnLoading.style.display = 'none';
                selectUsn.disabled = false;

                if (!data || data.length === 0) {
                    selectUsn.innerHTML = '<option value="">No students found in roster for this class</option>';
                    if (btnConfirmStudent) btnConfirmStudent.disabled = true;
                    return;
                }

                let opts = '<option value="">-- Select your USN / Name --</option>';
                data.forEach(st => {
                    const label = st.usn ? `${st.usn} — ${st.name}` : st.name;
                    opts += `<option value="${st.id}" data-usn="${st.usn || ''}" data-name="${st.name}">${label}</option>`;
                });
                selectUsn.innerHTML = opts;
                if (btnConfirmStudent) btnConfirmStudent.disabled = true;
            })
            .catch(err => {
                if (usnLoading) usnLoading.style.display = 'none';
                selectUsn.disabled = false;
                selectUsn.innerHTML = '<option value="">Error loading list. Refresh and try again.</option>';
                console.error('Error fetching students:', err);
            });
    };

    if (selectYear && selectSection) {
        selectYear.onchange = loadClassStudents;
        selectSection.onchange = loadClassStudents;
    }

    if (selectUsn && btnConfirmStudent) {
        selectUsn.onchange = () => {
            btnConfirmStudent.disabled = !selectUsn.value;
        };

        btnConfirmStudent.onclick = () => {
            const selectedOpt = selectUsn.options[selectUsn.selectedIndex];
            if (!selectedOpt || !selectedOpt.value) return;

            const studentId = selectedOpt.value;
            const studentName = selectedOpt.getAttribute('data-name');
            const studentUsn = selectedOpt.getAttribute('data-usn');
            const year = selectYear.value;
            const section = selectSection.value;

            // Display confirmed card
            if (dispStudentName) dispStudentName.textContent = studentName;
            if (dispStudentMeta) {
                dispStudentMeta.textContent = `${year} Year · Section ${section} · USN: ${studentUsn || 'N/A'}`;
            }
            if (studentVerifiedCard) studentVerifiedCard.style.display = 'block';

            // Lock selection inputs
            selectYear.disabled = true;
            selectSection.disabled = true;
            selectUsn.disabled = true;
            btnConfirmStudent.style.display = 'none';

            // Configure payment form
            if (formStudentId) formStudentId.value = studentId;
            if (formStudentSummary) {
                formStudentSummary.textContent = `${studentName} (${studentUsn ? studentUsn : 'No USN'}, ${year} yr Sec ${section})`;
            }

            // Update dedicated QR code
            const dedicatedQrUrl = `/qr/${year}/${section}`;
            if (crQrImg) crQrImg.src = dedicatedQrUrl;
            if (crQrDownload) {
                crQrDownload.href = dedicatedQrUrl;
                crQrDownload.download = `rajyotsava_qr_${year}_${section}.png`;
            }
            if (qrClassBadge) {
                qrClassBadge.textContent = `${year} Year - Sec ${section}`;
            }

            // Reveal payment section
            if (paymentSection) {
                paymentSection.style.display = 'grid';
                paymentSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        };
    }

    if (btnChangeStudent) {
        btnChangeStudent.onclick = () => {
            // Unlock inputs
            if (selectYear) selectYear.disabled = false;
            if (selectSection) selectSection.disabled = false;
            if (selectUsn) selectUsn.disabled = false;
            if (btnConfirmStudent) {
                btnConfirmStudent.style.display = 'inline-block';
                btnConfirmStudent.disabled = false;
            }
            if (studentVerifiedCard) studentVerifiedCard.style.display = 'none';
            if (paymentSection) paymentSection.style.display = 'none';
        };
    }

    // ---------------------------------------------
    // 3. Student Directory Live Multi-Filter
    // ---------------------------------------------
    const qInput = document.getElementById('q');
    const filterYear = document.getElementById('filter-year');
    const filterSec = document.getElementById('filter-sec');
    const dirCountPill = document.getElementById('dir-count-pill');
    const filterChips = document.querySelectorAll('[data-f]');
    const rows = document.querySelectorAll('#students-table tbody tr[data-name]');

    if (rows.length > 0) {
        let activeStatus = 'all';

        const runFilter = () => {
            const query = qInput ? qInput.value.trim().toLowerCase() : '';
            const selectedYear = filterYear ? filterYear.value : 'all';
            const selectedSec = filterSec ? filterSec.value : 'all';

            let visibleCount = 0;
            let visibleDoneCount = 0;

            rows.forEach(r => {
                const name = r.dataset.name || '';
                const usn = r.dataset.usn || '';
                const year = r.dataset.year || '';
                const sec = r.dataset.sec || '';
                const status = r.dataset.s || '';

                const matchesQuery = !query || name.includes(query) || usn.includes(query);
                const matchesYear = (selectedYear === 'all') || (year === selectedYear);
                const matchesSec = (selectedSec === 'all') || (sec === selectedSec);
                const matchesStatus = (activeStatus === 'all') || (status === activeStatus);

                const isVisible = matchesQuery && matchesYear && matchesSec && matchesStatus;
                r.hidden = !isVisible;

                if (isVisible) {
                    visibleCount++;
                    if (status === 'done') visibleDoneCount++;
                }
            });

            if (dirCountPill) {
                dirCountPill.textContent = `${visibleDoneCount} of ${visibleCount} contributed`;
            }
        };

        if (qInput) qInput.oninput = runFilter;
        if (filterYear) filterYear.onchange = runFilter;
        if (filterSec) filterSec.onchange = runFilter;

        filterChips.forEach(b => {
            b.onclick = () => {
                activeStatus = b.dataset.f;
                filterChips.forEach(x => x.classList.toggle('on', x === b));
                runFilter();
            };
        });
    }
});
