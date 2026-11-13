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
    const sectionSelectWrapper = document.getElementById('section-select-wrapper');
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

    // Fetch students list for the selected class/section
    const fetchStudentsForSelection = (year, section) => {
        if (!selectUsn) return;

        if (usnLoading) usnLoading.style.display = 'block';
        selectUsn.disabled = true;
        selectUsn.innerHTML = '<option value="">Loading students…</option>';

        let url = `/api/students?year=${encodeURIComponent(year)}`;
        if (year !== '3' && section) {
            url += `&section=${encodeURIComponent(section)}`;
        }

        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (usnLoading) usnLoading.style.display = 'none';
                selectUsn.disabled = false;

                if (!data || data.length === 0) {
                    selectUsn.innerHTML = '<option value="">No students found for this class</option>';
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

    // When Year is chosen:
    // 1st Year -> only A and B
    // 2nd Year -> A, B, C
    // 3rd Year -> No section needed, immediately fetch students!
    if (selectYear) {
        selectYear.onchange = () => {
            const year = selectYear.value;
            if (!year) {
                if (sectionSelectWrapper) sectionSelectWrapper.style.display = 'block';
                if (selectSection) {
                    selectSection.innerHTML = '<option value="">-- Choose Section --</option>';
                    selectSection.disabled = true;
                }
                if (selectUsn) {
                    selectUsn.innerHTML = '<option value="">-- Select class first --</option>';
                    selectUsn.disabled = true;
                }
                if (btnConfirmStudent) btnConfirmStudent.disabled = true;
                return;
            }

            if (year === '3') {
                // 3rd Year has NO sections
                if (sectionSelectWrapper) sectionSelectWrapper.style.display = 'none';
                if (selectSection) {
                    selectSection.value = '';
                    selectSection.required = false;
                }
                fetchStudentsForSelection('3', '');
            } else if (year === '1') {
                // 1st Year has only Sections A and B
                if (sectionSelectWrapper) sectionSelectWrapper.style.display = 'block';
                if (selectSection) {
                    selectSection.required = true;
                    selectSection.disabled = false;
                    selectSection.innerHTML = '<option value="">-- Choose Section --</option><option value="A">Section A</option><option value="B">Section B</option>';
                }
                if (selectUsn) {
                    selectUsn.innerHTML = '<option value="">-- Choose Section first --</option>';
                    selectUsn.disabled = true;
                }
                if (btnConfirmStudent) btnConfirmStudent.disabled = true;
            } else if (year === '2') {
                // 2nd Year has Sections A, B, and C
                if (sectionSelectWrapper) sectionSelectWrapper.style.display = 'block';
                if (selectSection) {
                    selectSection.required = true;
                    selectSection.disabled = false;
                    selectSection.innerHTML = '<option value="">-- Choose Section --</option><option value="A">Section A</option><option value="B">Section B</option><option value="C">Section C</option>';
                }
                if (selectUsn) {
                    selectUsn.innerHTML = '<option value="">-- Choose Section first --</option>';
                    selectUsn.disabled = true;
                }
                if (btnConfirmStudent) btnConfirmStudent.disabled = true;
            }
        };
    }

    if (selectSection) {
        selectSection.onchange = () => {
            const year = selectYear ? selectYear.value : '';
            const section = selectSection.value;
            if (year && section) {
                fetchStudentsForSelection(year, section);
            } else {
                if (selectUsn) {
                    selectUsn.innerHTML = '<option value="">-- Choose Section first --</option>';
                    selectUsn.disabled = true;
                }
                if (btnConfirmStudent) btnConfirmStudent.disabled = true;
            }
        };
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
            const section = selectSection ? selectSection.value : '';

            // Display confirmed card
            if (dispStudentName) dispStudentName.textContent = studentName;
            if (dispStudentMeta) {
                if (year === '3') {
                    dispStudentMeta.textContent = `3rd Year · USN: ${studentUsn || 'N/A'}`;
                } else {
                    dispStudentMeta.textContent = `${year} Year · Section ${section} · USN: ${studentUsn || 'N/A'}`;
                }
            }
            if (studentVerifiedCard) studentVerifiedCard.style.display = 'block';

            // Lock selection inputs
            if (selectYear) selectYear.disabled = true;
            if (selectSection) selectSection.disabled = true;
            if (selectUsn) selectUsn.disabled = true;
            btnConfirmStudent.style.display = 'none';

            // Configure payment form
            if (formStudentId) formStudentId.value = studentId;
            if (formStudentSummary) {
                if (year === '3') {
                    formStudentSummary.textContent = `${studentName} (${studentUsn ? studentUsn : 'No USN'}, 3rd Year)`;
                } else {
                    formStudentSummary.textContent = `${studentName} (${studentUsn ? studentUsn : 'No USN'}, ${year} yr Sec ${section})`;
                }
            }

            // Update dedicated QR code
            let dedicatedQrUrl = '';
            let downloadFilename = '';
            let badgeText = '';

            if (year === '3') {
                dedicatedQrUrl = `/qr/3`;
                downloadFilename = `rajyotsava_qr_3rd_year.png`;
                badgeText = `3rd Year`;
            } else {
                dedicatedQrUrl = `/qr/${year}/${section}`;
                downloadFilename = `rajyotsava_qr_${year}_${section}.png`;
                badgeText = `${year} Year - Sec ${section}`;
            }

            if (crQrImg) crQrImg.src = dedicatedQrUrl;
            if (crQrDownload) {
                crQrDownload.href = dedicatedQrUrl;
                crQrDownload.download = downloadFilename;
            }
            if (qrClassBadge) {
                qrClassBadge.textContent = badgeText;
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
    const filterSecWrapper = document.getElementById('dir-section-filter-wrapper');
    const filterSec = document.getElementById('filter-sec');
    const dirCountPill = document.getElementById('dir-count-pill');
    const filterChips = document.querySelectorAll('[data-f]');
    const rows = document.querySelectorAll('#students-table tbody tr[data-name]');

    if (rows.length > 0) {
        let activeStatus = 'all';

        const updateDirSectionDropdown = () => {
            if (!filterYear || !filterSec) return;
            const y = filterYear.value;
            if (y === '3') {
                // 3rd year has no sections
                if (filterSecWrapper) filterSecWrapper.style.display = 'none';
                filterSec.value = 'all';
            } else if (y === '1') {
                if (filterSecWrapper) filterSecWrapper.style.display = 'block';
                const cur = filterSec.value;
                filterSec.innerHTML = '<option value="all">All Sections (A, B)</option><option value="A">Section A</option><option value="B">Section B</option>';
                filterSec.value = (cur === 'A' || cur === 'B') ? cur : 'all';
            } else if (y === '2') {
                if (filterSecWrapper) filterSecWrapper.style.display = 'block';
                const cur = filterSec.value;
                filterSec.innerHTML = '<option value="all">All Sections (A, B, C)</option><option value="A">Section A</option><option value="B">Section B</option><option value="C">Section C</option>';
                filterSec.value = (cur === 'A' || cur === 'B' || cur === 'C') ? cur : 'all';
            } else {
                if (filterSecWrapper) filterSecWrapper.style.display = 'block';
                const cur = filterSec.value;
                filterSec.innerHTML = '<option value="all">All Sections</option><option value="A">Section A</option><option value="B">Section B</option><option value="C">Section C</option>';
                filterSec.value = cur || 'all';
            }
        };

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
                const matchesSec = (selectedSec === 'all') || (year === '3') || (sec === selectedSec);
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
        if (filterYear) {
            filterYear.onchange = () => {
                updateDirSectionDropdown();
                runFilter();
            };
        }
        if (filterSec) filterSec.onchange = runFilter;

        filterChips.forEach(b => {
            b.onclick = () => {
                activeStatus = b.dataset.f;
                filterChips.forEach(x => x.classList.toggle('on', x === b));
                runFilter();
            };
        });

        updateDirSectionDropdown();
    }
});
