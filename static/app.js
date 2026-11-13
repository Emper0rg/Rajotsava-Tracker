document.addEventListener("DOMContentLoaded", () => {
    // ---------------------------------------------
    // CR WhatsApp Contacts Mapping
    // ---------------------------------------------
    const CR_CONTACTS = {
        "1-A": { name: "Manohar R", phone: "+91 90190 41255", wa: "919019041255" },
        "1-B": { name: "Mohammed Riyan", phone: "+91 98867 79436", wa: "919886779436" },
        "2-A": { name: "Guru Vishnu M", phone: "+91 96639 79235", wa: "919663979235" },
        "2-B": { name: "Prasad Mouli", phone: "+91 97432 32215", wa: "919743232215" },
        "2-C": { name: "Guru Kiran", phone: "+91 90198 49002", wa: "919019849002" },
        "3":   { name: "Suhel Siddiqee", phone: "+91 81977 02182", wa: "918197702182" },
        "3-A": { name: "Suhel Siddiqee", phone: "+91 81977 02182", wa: "918197702182" }
    };

    const getCR = (year, section) => {
        if (!year) return null;
        if (year === '3') return CR_CONTACTS['3'];
        const sec = section ? section.toUpperCase() : '';
        return CR_CONTACTS[`${year}-${sec}`] || null;
    };

    // ---------------------------------------------
    // 1. Amount selection chips
    // ---------------------------------------------
    document.querySelectorAll('[data-amt]').forEach(b => {
        b.onclick = () => {
            const amtInput = document.getElementById('amount');
            if (amtInput) {
                amtInput.value = b.dataset.amt;
                amtInput.dispatchEvent(new Event('input'));
            }
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
    const crContactName = document.getElementById('cr-contact-name');
    const crContactPhone = document.getElementById('cr-contact-phone');
    const crWhatsappBtn = document.getElementById('cr-whatsapp-btn');
    const utrInput = document.getElementById('utr');
    const amountInput = document.getElementById('amount');

    let confirmedStudent = null;

    // Helper to update WhatsApp share link
    const updateWhatsappLink = () => {
        if (!confirmedStudent || !crWhatsappBtn) return;
        const cr = getCR(confirmedStudent.year, confirmedStudent.section);
        if (!cr) return;

        const amt = amountInput ? amountInput.value : '200';
        const utr = utrInput ? utrInput.value.trim() : '';
        const classLabel = confirmedStudent.year === '3' ? '3rd Year' : `${confirmedStudent.year} Year Sec ${confirmedStudent.section}`;
        const utrText = utr ? `UTR: ${utr}` : 'UTR: (refer screenshot)';

        const msg = `Hi ${cr.name}, I have made my payment of ₹${amt} for Kannada Rajyotsava.\n\nStudent: ${confirmedStudent.name}\nClass: ${classLabel}\nUSN: ${confirmedStudent.usn || 'N/A'}\n${utrText}\n\nPlease find my payment screenshot attached. Kindly verify!`;
        crWhatsappBtn.href = `https://wa.me/${cr.wa}?text=${encodeURIComponent(msg)}`;
    };

    if (utrInput) utrInput.addEventListener('input', updateWhatsappLink);
    if (amountInput) amountInput.addEventListener('input', updateWhatsappLink);

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
                if (sectionSelectWrapper) sectionSelectWrapper.style.display = 'none';
                if (selectSection) {
                    selectSection.value = '';
                    selectSection.required = false;
                }
                fetchStudentsForSelection('3', '');
            } else if (year === '1') {
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

            confirmedStudent = {
                id: studentId,
                name: studentName,
                usn: studentUsn,
                year: year,
                section: section
            };

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

            // Update dedicated CR WhatsApp contact info
            const cr = getCR(year, section);
            if (cr) {
                if (crContactName) crContactName.textContent = cr.name;
                if (crContactPhone) crContactPhone.textContent = cr.phone;
                updateWhatsappLink();
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
            confirmedStudent = null;
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
    // 3. Cultural Participation Overhaul
    // ---------------------------------------------
    const pillSolo = document.getElementById('pill-solo');
    const pillGroup = document.getElementById('pill-group');
    const cultSoloBox = document.getElementById('cult-solo-box');
    const cultGroupBox = document.getElementById('cult-group-box');
    const cultYear = document.getElementById('cult-year');
    const cultSecWrapper = document.getElementById('cult-section-wrapper');
    const cultSection = document.getElementById('cult-section');
    const cultSoloStudent = document.getElementById('cult-solo-student');
    const cultGroupPicker = document.getElementById('cult-group-student-picker');
    const cultAddMemberBtn = document.getElementById('cult-add-member-btn');
    const cultMembersList = document.getElementById('cult-members-list');
    const cultMemberCount = document.getElementById('cult-member-count');
    const cultMemberIdsInput = document.getElementById('cult-member-ids-input');
    const cultNoMembersMsg = document.getElementById('cult-no-members-msg');
    const cultCrNotice = document.getElementById('cult-cr-notice');
    const cultCrName = document.getElementById('cult-cr-name');
    const cultCrPhone = document.getElementById('cult-cr-phone');
    const cultCrWhatsappBtn = document.getElementById('cult-cr-whatsapp-btn');
    const cultForm = document.getElementById('cultural-form');

    let currentPerfType = 'solo';
    let groupMembers = []; // Array of { id, name, usn }

    // Toggle Solo vs Group
    if (pillSolo && pillGroup) {
        pillSolo.onclick = () => {
            currentPerfType = 'solo';
            pillSolo.classList.add('on');
            pillGroup.classList.remove('on');
            pillSolo.querySelector('input').checked = true;
            if (cultSoloBox) cultSoloBox.style.display = 'block';
            if (cultGroupBox) cultGroupBox.style.display = 'none';
            if (cultSoloStudent) cultSoloStudent.required = true;
            if (cultMemberIdsInput) cultMemberIdsInput.required = false;
            updateCultCrNotice();
        };

        pillGroup.onclick = () => {
            currentPerfType = 'group';
            pillGroup.classList.add('on');
            pillSolo.classList.remove('on');
            pillGroup.querySelector('input').checked = true;
            if (cultSoloBox) cultSoloBox.style.display = 'none';
            if (cultGroupBox) cultGroupBox.style.display = 'block';
            if (cultSoloStudent) cultSoloStudent.required = false;
            if (cultMemberIdsInput) cultMemberIdsInput.required = true;
            updateCultCrNotice();
        };
    }

    const updateCultCrNotice = () => {
        if (!cultYear || !cultCrNotice) return;
        const y = cultYear.value;
        const s = cultSection ? cultSection.value : '';
        const cr = getCR(y, s);

        if (cr && (y === '3' || s)) {
            cultCrNotice.style.display = 'block';
            if (cultCrName) cultCrName.textContent = cr.name;
            if (cultCrPhone) cultCrPhone.textContent = cr.phone;
            if (cultCrWhatsappBtn) {
                const msg = `Hi ${cr.name}, I am participating in Kannada Rajyotsava Cultural Programs (${currentPerfType.toUpperCase()} performance). Please note my entry!`;
                cultCrWhatsappBtn.href = `https://wa.me/${cr.wa}?text=${encodeURIComponent(msg)}`;
            }
        } else {
            cultCrNotice.style.display = 'none';
        }
    };

    // Load students for cultural section
    const loadCultStudents = () => {
        if (!cultYear) return;
        const y = cultYear.value;
        const s = cultSection ? cultSection.value : '';

        if (!y || (y !== '3' && !s)) {
            if (cultSoloStudent) {
                cultSoloStudent.innerHTML = '<option value="">-- Choose Class & Section above first --</option>';
                cultSoloStudent.disabled = true;
            }
            if (cultGroupPicker) {
                cultGroupPicker.innerHTML = '<option value="">-- Choose Class & Section above first --</option>';
                cultGroupPicker.disabled = true;
            }
            if (cultAddMemberBtn) cultAddMemberBtn.disabled = true;
            updateCultCrNotice();
            return;
        }

        let url = `/api/students?year=${encodeURIComponent(y)}`;
        if (y !== '3' && s) {
            url += `&section=${encodeURIComponent(s)}`;
        }

        fetch(url)
            .then(res => res.json())
            .then(data => {
                let opts = '<option value="">-- Select student from roster --</option>';
                if (data && data.length > 0) {
                    data.forEach(st => {
                        const label = st.usn ? `${st.name} (${st.usn})` : st.name;
                        opts += `<option value="${st.id}" data-name="${st.name}" data-usn="${st.usn || ''}" data-meta="${st.year} yr ${st.section}">${label}</option>`;
                    });
                } else {
                    opts = '<option value="">No students found in this section</option>';
                }

                if (cultSoloStudent) {
                    cultSoloStudent.innerHTML = opts;
                    cultSoloStudent.disabled = false;
                }
                if (cultGroupPicker) {
                    cultGroupPicker.innerHTML = opts;
                    cultGroupPicker.disabled = false;
                }
                if (cultAddMemberBtn) cultAddMemberBtn.disabled = false;
                updateCultCrNotice();
            })
            .catch(err => {
                console.error('Error fetching cultural students:', err);
            });
    };

    if (cultYear) {
        cultYear.onchange = () => {
            const y = cultYear.value;
            if (y === '3') {
                if (cultSecWrapper) cultSecWrapper.style.display = 'none';
                if (cultSection) {
                    cultSection.value = '';
                    cultSection.required = false;
                }
            } else if (y === '1') {
                if (cultSecWrapper) cultSecWrapper.style.display = 'block';
                if (cultSection) {
                    cultSection.required = true;
                    cultSection.innerHTML = '<option value="">-- Choose Section --</option><option value="A">Section A</option><option value="B">Section B</option>';
                }
            } else if (y === '2') {
                if (cultSecWrapper) cultSecWrapper.style.display = 'block';
                if (cultSection) {
                    cultSection.required = true;
                    cultSection.innerHTML = '<option value="">-- Choose Section --</option><option value="A">Section A</option><option value="B">Section B</option><option value="C">Section C</option>';
                }
            } else {
                if (cultSecWrapper) cultSecWrapper.style.display = 'block';
                if (cultSection) {
                    cultSection.innerHTML = '<option value="">-- Choose Section --</option>';
                }
            }
            loadCultStudents();
        };
    }

    if (cultSection) {
        cultSection.onchange = loadCultStudents;
    }

    // Group Member Rendering & Management
    const renderGroupMembers = () => {
        if (!cultMembersList) return;
        cultMembersList.innerHTML = '';

        if (groupMembers.length === 0) {
            if (cultNoMembersMsg) cultMembersList.appendChild(cultNoMembersMsg);
        } else {
            groupMembers.forEach((m, idx) => {
                const item = document.createElement('div');
                item.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: #1c1c1c; border-radius: 6px; border: 1px solid #333;';
                item.innerHTML = `
                    <div>
                        <span style="font-weight: 700; color: #fff;">${idx + 1}. ${m.name}</span>
                        <span style="font-size: 0.8rem; color: #aaa; margin-left: 6px;">(${m.usn || 'No USN'}, ${m.meta})</span>
                    </div>
                    <button type="button" class="chip no" style="padding: 2px 8px; font-size: 0.75rem;" data-remove-id="${m.id}">✕ Remove</button>
                `;
                item.querySelector('button').onclick = () => {
                    groupMembers = groupMembers.filter(gm => gm.id !== m.id);
                    renderGroupMembers();
                };
                cultMembersList.appendChild(item);
            });
        }

        if (cultMemberCount) {
            const ok = groupMembers.length >= 2;
            cultMemberCount.textContent = `${groupMembers.length} member(s) added ${ok ? '✓ (Eligible)' : '(Need min 2)'}`;
            cultMemberCount.style.background = ok ? '#25d366' : '#333';
            cultMemberCount.style.color = ok ? '#000' : '#fff';
            cultMemberCount.style.fontWeight = ok ? '700' : 'normal';
        }

        if (cultMemberIdsInput) {
            cultMemberIdsInput.value = groupMembers.map(m => m.id).join(',');
        }
    };

    if (cultAddMemberBtn && cultGroupPicker) {
        cultAddMemberBtn.onclick = () => {
            const sel = cultGroupPicker.options[cultGroupPicker.selectedIndex];
            if (!sel || !sel.value) return;

            const id = parseInt(sel.value, 10);
            if (groupMembers.some(m => m.id === id)) {
                alert('This student has already been added to the group.');
                return;
            }

            groupMembers.push({
                id: id,
                name: sel.getAttribute('data-name'),
                usn: sel.getAttribute('data-usn'),
                meta: sel.getAttribute('data-meta')
            });

            renderGroupMembers();
        };
    }

    if (cultForm) {
        cultForm.onsubmit = (e) => {
            if (currentPerfType === 'group') {
                if (groupMembers.length < 2) {
                    e.preventDefault();
                    alert('A group performance requires at least 2 students. Please add more members to continue!');
                    return false;
                }
            }
        };
    }

    // ---------------------------------------------
    // 4. Student Directory Live Multi-Filter
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
