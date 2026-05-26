/* ===================================================
   JAVASCRIPT CONTROLLER: TUSAIDIANE - MSIBA OLELE
   =================================================== */

// --- SECURITY HELPER ---
function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

document.addEventListener("DOMContentLoaded", () => {
    // Current active step track
    let currentStep = 1;
    const totalSteps = 5;

    // Data Storage for files & dynamic structures
    let memberPhotoBase64 = null;
    let dependentsList = []; // Array of { id, name, relation, age, phone, photoBase64 }
    let signaturePad = null;

    // Admin login form listener
    const adminLoginForm = document.getElementById("adminLoginForm");
    if (adminLoginForm) {
        adminLoginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            if (typeof handleAdminLogin === "function") {
                handleAdminLogin();
            }
        });
    }

    // Initialize Date field to current date
    const dateInput = document.getElementById("tareheSaini");
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
    }

    // --- STEP NAVIGATION LOGIC ---
    window.nextStep = (step) => {
        if (!validateStep(step)) {
            return;
        }

        // Add class completed to badge
        const badge = document.querySelector(`.step-badge[data-step="${step}"]`);
        if (badge) {
            badge.classList.add("completed");
        }

        // Hide current step, show next
        document.getElementById(`step-${step}`).classList.remove("active");
        currentStep = step + 1;
        document.getElementById(`step-${currentStep}`).classList.add("active");

        // Update progress bar
        updateProgress();

        // Update step indicators active status
        updateBadgeActive();

        // If step 5, handle signature canvas sizing
        if (currentStep === 5) {
            resizeCanvas();
        }
    };

    window.prevStep = (step) => {
        // Remove class completed from current badge
        const prevBadge = document.querySelector(`.step-badge[data-step="${step - 1}"]`);
        if (prevBadge) {
            prevBadge.classList.remove("completed");
        }

        document.getElementById(`step-${step}`).classList.remove("active");
        currentStep = step - 1;
        document.getElementById(`step-${currentStep}`).classList.add("active");

        updateProgress();
        updateBadgeActive();
    };

    function updateProgress() {
        const progressBar = document.getElementById("progressBar");
        const percentage = ((currentStep - 1) / (totalSteps - 1)) * 100;
        progressBar.style.width = `${percentage}%`;
    }

    function updateBadgeActive() {
        document.querySelectorAll(".step-badge").forEach(badge => {
            const stepNum = parseInt(badge.getAttribute("data-step"));
            if (stepNum === currentStep) {
                badge.classList.add("active");
            } else {
                badge.classList.remove("active");
            }
        });
    }

    // --- FORM VALIDATION ---
    function validateStep(step) {
        const activeSection = document.getElementById(`step-${step}`);
        const requiredInputs = activeSection.querySelectorAll("[required]");
        let isValid = true;

        // Clear existing custom alert styling
        requiredInputs.forEach(input => {
            input.style.borderColor = "";
        });

        // 1. Basic HTML5 validation check
        for (let input of requiredInputs) {
            // Special check for radios
            if (input.type === "radio") {
                const name = input.name;
                const checked = activeSection.querySelector(`input[name="${name}"]:checked`);
                if (!checked) {
                    alert("Tafadhali chagua Jinsia");
                    isValid = false;
                    break;
                }
            } else if (!input.value.trim()) {
                input.style.borderColor = "var(--color-danger)";
                input.focus();
                isValid = false;
                break;
            }
        }

        if (!isValid) return false;

        // 2. Step specific custom checks
        if (step === 1) {
            // Passport photo required
            if (!memberPhotoBase64) {
                alert("Tafadhali weka picha ya pasipoti (Passport size) ya Mwanakikundi.");
                document.getElementById("memberPhotoUpload").style.borderColor = "var(--color-danger)";
                isValid = false;
            }
        }

        if (step === 3) {
            // Check that all added dependents have fields filled
            for (let dep of dependentsList) {
                if (!dep.name || !dep.relation || !dep.age) {
                    alert("Tafadhali jaza taarifa zote kwa wategemezi wako.");
                    isValid = false;
                    break;
                }
            }
        }

        return isValid;
    }

    // --- PHOTO UPLOADER LOGIC (MEMBER) ---
    const memberPhotoUpload = document.getElementById("memberPhotoUpload");
    const memberPhotoFile = document.getElementById("memberPhotoFile");
    const memberPhotoPlaceholder = document.getElementById("memberPhotoPlaceholder");
    const memberPhotoPreview = document.getElementById("memberPhotoPreview");
    const removeMemberPhoto = document.getElementById("removeMemberPhoto");

    // Click to upload triggers file selector (removed to fix double-click bug since input covers the box)


    memberPhotoFile.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert("Picha imezidi ukubwa unaoruhusiwa (2MB). Tafadhali weka picha ndogo.");
                memberPhotoFile.value = "";
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                memberPhotoBase64 = event.target.result;
                memberPhotoPreview.src = memberPhotoBase64;
                memberPhotoPreview.classList.remove("hidden");
                memberPhotoPlaceholder.classList.add("hidden");
                removeMemberPhoto.classList.remove("hidden");
                memberPhotoUpload.style.borderColor = "var(--color-success)";
            };
            reader.readAsDataURL(file);
        }
    });

    removeMemberPhoto.addEventListener("click", (e) => {
        e.stopPropagation();
        memberPhotoBase64 = null;
        memberPhotoFile.value = "";
        memberPhotoPreview.src = "";
        memberPhotoPreview.classList.add("hidden");
        memberPhotoPlaceholder.classList.remove("hidden");
        removeMemberPhoto.classList.add("hidden");
        memberPhotoUpload.style.borderColor = "";
    });

    // --- DYNAMIC DEPENDENTS LIST LOGIC ---
    const addDependentBtn = document.getElementById("addDependentBtn");
    const dependentsContainer = document.getElementById("dependentsContainer");

    addDependentBtn.addEventListener("click", () => {
        const depId = Date.now().toString();
        const dependent = {
            id: depId,
            name: "",
            relation: "",
            age: "",
            phone: "",
            photoBase64: null
        };
        dependentsList.push(dependent);
        renderDependentCard(dependent);
    });

    function renderDependentCard(dependent) {
        const card = document.createElement("div");
        card.className = "dependent-card";
        card.id = `dep-card-${dependent.id}`;

        // Header
        const header = document.createElement("div");
        header.className = "dependent-card-header";

        const title = document.createElement("span");
        title.className = "dependent-card-title";
        title.textContent = "Mtegemezi";

        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "remove-dependent-btn";
        removeBtn.dataset.id = dependent.id;

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("width", "18");
        svg.setAttribute("height", "18");
        svg.setAttribute("fill", "none");
        svg.setAttribute("stroke", "currentColor");
        svg.setAttribute("stroke-width", "2");

        const line1 = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line1.setAttribute("x1", "18"); line1.setAttribute("y1", "6");
        line1.setAttribute("x2", "6"); line1.setAttribute("y2", "18");

        const line2 = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line2.setAttribute("x1", "6"); line2.setAttribute("y1", "6");
        line2.setAttribute("x2", "18"); line2.setAttribute("y2", "18");

        svg.appendChild(line1);
        svg.appendChild(line2);
        removeBtn.appendChild(svg);
        header.appendChild(title);
        header.appendChild(removeBtn);

        // Body grid
        const grid = document.createElement("div");
        grid.className = "grid-layout";

        const left = document.createElement("div");
        left.className = "form-group span-8 grid-layout";

        // Name field
        const g1 = document.createElement("div");
        g1.className = "form-group span-12";
        const l1 = document.createElement("label");
        l1.innerHTML = `Jina Kamili (Majina Matatu) <span class="required">*</span>`;
        const i1 = document.createElement("input");
        i1.type = "text";
        i1.className = "dep-input-name uppercase";
        i1.placeholder = "MF. ANNA JOSEPH MASSAWE";
        i1.required = true;
        i1.dataset.id = dependent.id;
        g1.appendChild(l1); g1.appendChild(i1);

        // Relation + Age
        const g2 = document.createElement("div");
        g2.className = "form-group span-6";
        const l2 = document.createElement("label");
        l2.innerHTML = `Mahusiano <span class="required">*</span>`;
        const i2 = document.createElement("input");
        i2.type = "text";
        i2.className = "dep-input-relation uppercase";
        i2.placeholder = "MF. MTOTO / MAMA";
        i2.required = true;
        i2.dataset.id = dependent.id;
        g2.appendChild(l2); g2.appendChild(i2);

        const g3 = document.createElement("div");
        g3.className = "form-group span-6";
        const l3 = document.createElement("label");
        l3.innerHTML = `Umri <span class="required">*</span>`;
        const i3 = document.createElement("input");
        i3.type = "number";
        i3.className = "dep-input-age";
        i3.placeholder = "Miaka";
        i3.min = "0";
        i3.required = true;
        i3.dataset.id = dependent.id;
        g3.appendChild(l3); g3.appendChild(i3);

        // Phone
        const g4 = document.createElement("div");
        g4.className = "form-group span-12";
        const l4 = document.createElement("label");
        l4.textContent = "Namba ya Simu (Kama ipo)";
        const i4 = document.createElement("input");
        i4.type = "tel";
        i4.className = "dep-input-phone";
        i4.placeholder = "MF. 07XXXXXXXX";
        i4.dataset.id = dependent.id;
        g4.appendChild(l4); g4.appendChild(i4);

        left.appendChild(g1); left.appendChild(g2); left.appendChild(g3); left.appendChild(g4);

        // Photo column
        const right = document.createElement("div");
        right.className = "span-4 flex-center flex-column";

        const pl = document.createElement("label");
        pl.innerHTML = `Picha ya Mtegemezi <span class="required">*</span>`;

        const uploadBox = document.createElement("div");
        uploadBox.className = "photo-upload-box small";
        uploadBox.id = `dep-upload-box-${dependent.id}`;

        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = "image/*";
        fileInput.className = "file-input dep-file-input";
        fileInput.dataset.id = dependent.id;

        const placeholder = document.createElement("div");
        placeholder.className = "upload-placeholder";
        placeholder.id = `dep-placeholder-${dependent.id}`;

        const phSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        phSvg.setAttribute("viewBox", "0 0 24 24");
        phSvg.setAttribute("width", "24");
        phSvg.setAttribute("height", "24");
        phSvg.setAttribute("fill", "none");
        phSvg.setAttribute("stroke", "currentColor");
        phSvg.setAttribute("stroke-width", "1.5");

        const phPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        phPath.setAttribute("d", "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z");
        const phCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        phCircle.setAttribute("cx", "12"); phCircle.setAttribute("cy", "13"); phCircle.setAttribute("r", "4");

        phSvg.appendChild(phPath); phSvg.appendChild(phCircle);

        const phText = document.createElement("span");
        phText.textContent = "Weka picha";

        placeholder.appendChild(phSvg);
        placeholder.appendChild(phText);

        const preview = document.createElement("img");
        preview.id = `dep-preview-${dependent.id}`;
        preview.className = "photo-preview hidden";
        preview.alt = "Dependent passport photo";

        const remBtn = document.createElement("button");
        remBtn.type = "button";
        remBtn.className = "remove-photo-btn hidden";
        remBtn.id = `dep-remove-btn-${dependent.id}`;
        remBtn.dataset.id = dependent.id;
        remBtn.textContent = "Futa";

        uploadBox.appendChild(fileInput);
        uploadBox.appendChild(placeholder);
        uploadBox.appendChild(preview);
        uploadBox.appendChild(remBtn);

        right.appendChild(pl);
        right.appendChild(uploadBox);

        grid.appendChild(left);
        grid.appendChild(right);

        card.appendChild(header);
        card.appendChild(grid);

        dependentsContainer.appendChild(card);

        // Bind input change events to update data model
        card.querySelector(".dep-input-name").addEventListener("input", (e) => {
            dependent.name = e.target.value.toUpperCase();
        });
        card.querySelector(".dep-input-relation").addEventListener("input", (e) => {
            dependent.relation = e.target.value.toUpperCase();
        });
        card.querySelector(".dep-input-age").addEventListener("input", (e) => {
            dependent.age = e.target.value;
        });
        card.querySelector(".dep-input-phone").addEventListener("input", (e) => {
            dependent.phone = e.target.value;
        });

        // Dependent Photo Upload (removed click trigger to fix double-click bug)


        fileInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 2 * 1024 * 1024) {
                    alert("Picha imezidi ukubwa unaoruhusiwa (2MB).");
                    fileInput.value = "";
                    return;
                }
                const reader = new FileReader();
                reader.onload = (event) => {
                    dependent.photoBase64 = event.target.result;
                    preview.src = dependent.photoBase64;
                    preview.classList.remove("hidden");
                    placeholder.classList.add("hidden");
                    remBtn.classList.remove("hidden");
                    uploadBox.style.borderColor = "var(--color-success)";
                };
                reader.readAsDataURL(file);
            }
        });

        remBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            dependent.photoBase64 = null;
            fileInput.value = "";
            preview.src = "";
            preview.classList.add("hidden");
            placeholder.classList.remove("hidden");
            remBtn.classList.add("hidden");
            uploadBox.style.borderColor = "";
        });

        // Delete Dependent Card Button
        card.querySelector(".remove-dependent-btn").addEventListener("click", (e) => {
            const idToRemove = e.currentTarget.getAttribute("data-id");
            dependentsList = dependentsList.filter(d => d.id !== idToRemove);
            const cardEl = document.getElementById(`dep-card-${idToRemove}`);
            if (cardEl) {
                cardEl.classList.add("hidden"); // Smooth hide
                setTimeout(() => cardEl.remove(), 300);
            }
        });
    }

    // --- SIGNATURE PAD LOGIC ---
    const canvas = document.getElementById("signatureCanvas");
    const clearSignatureBtn = document.getElementById("clearSignatureBtn");

    if (canvas) {
        signaturePad = new SignaturePad(canvas, {
            backgroundColor: 'rgb(255, 255, 255)',
            penColor: 'rgb(11, 34, 101)' // Dark blue ink to look official
        });

        clearSignatureBtn.addEventListener("click", () => {
            signaturePad.clear();
        });
    }

    // Handle canvas resizing properly so line rendering is correct
    function resizeCanvas() {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext("2d").scale(ratio, ratio);
        signaturePad.clear(); // Clear canvas after resize to avoid alignment shifts
    }

    window.addEventListener("resize", () => {
        if (currentStep === 5) {
            resizeCanvas();
        }
    });

    // --- BUILD REGISTRATION DATA OBJECT (shared between submission and admin PDF) ---
    function buildRegistrationData() {
        // Build NOK data
        const nokData = [];
        for (let i = 1; i <= 4; i++) {
            const nameEl = document.getElementsByName(`nokJina_${i}`)[0];
            const phoneEl = document.getElementsByName(`nokSimu_${i}`)[0];
            const relEl = document.getElementsByName(`nokUhusiano_${i}`)[0];
            nokData.push({
                jina: nameEl ? nameEl.value.trim().toUpperCase() : '',
                simu: phoneEl ? phoneEl.value.trim() : '',
                uhusiano: relEl ? relEl.value.trim().toUpperCase() : ''
            });
        }

        // Build Wadhamini data
        const wadhaminiData = [];
        for (let i = 1; i <= 2; i++) {
            const nameEl = document.getElementsByName(`wadhaminiJina_${i}`)[0];
            const phoneEl = document.getElementsByName(`wadhaminiSimu_${i}`)[0];
            const relEl = document.getElementsByName(`wadhaminiUhusiano_${i}`)[0];
            wadhaminiData.push({
                jina: nameEl ? nameEl.value.trim().toUpperCase() : '',
                simu: phoneEl ? phoneEl.value.trim() : '',
                uhusiano: relEl ? relEl.value.trim().toUpperCase() : ''
            });
        }

        const signatureDataURL = signaturePad && !signaturePad.isEmpty() ? signaturePad.toDataURL() : null;
        const tareheSaini = document.getElementById("tareheSaini").value || '';

        // Build full name
        const jinaKwanza = document.getElementById("jinaKwanza").value.trim().toUpperCase();
        const jinaPili = document.getElementById("jinaPili").value.trim().toUpperCase();
        const jinaTatu = document.getElementById("jinaTatu").value.trim().toUpperCase();
        const nambaSimu = document.getElementById("nambaSimu").value.trim();

        // Jinsia check
        const jinsiaRadio = document.querySelector('input[name="jinsia"]:checked');
        const jinsia = jinsiaRadio ? jinsiaRadio.value : '';

        const regData = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            fullName: `${jinaKwanza} ${jinaPili} ${jinaTatu}`,
            jinaKwanza,
            jinaPili,
            jinaTatu,
            jinsia,
            umri: document.getElementById("umri").value.trim(),
            memberPhotoBase64: memberPhotoBase64 || null,
            mkoaUnaloishi: document.getElementById("mkoaUnaloishi").value.trim().toUpperCase(),
            wilayaUnaloishi: document.getElementById("wilayaUnaloishi").value.trim().toUpperCase(),
            kataUnaloishi: document.getElementById("kataUnaloishi").value.trim().toUpperCase(),
            nambaSimu,
            kataUnayotokea: document.getElementById("kataUnayotokea").value.trim().toUpperCase(),
            kijijiUnachotokea: document.getElementById("kijijiUnachotokea").value.trim().toUpperCase(),
            dependents: dependentsList.map(d => ({
                name: d.name || '',
                relation: d.relation || '',
                age: d.age || '',
                phone: d.phone || '',
                photoBase64: d.photoBase64 || null
            })),
            nok: nokData,
            wadhamini: wadhaminiData,
            signatureBase64: signatureDataURL,
            tareheSaini
        };

        return regData;
    }

    // --- POPULATE PDF TEMPLATE FROM REGISTRATION DATA ---
    function populatePdfFromData(data) {
        // Page 1: Personal Details
        document.getElementById("pdfValJinaKwanza").textContent = data.jinaKwanza || '';
        document.getElementById("pdfValJinaPili").textContent = data.jinaPili || '';
        document.getElementById("pdfValJinaTatu").textContent = data.jinaTatu || '';

        if (data.jinsia === "Mwanaume") {
            document.getElementById("pdfValJinsiaMe").textContent = "[ X ]";
            document.getElementById("pdfValJinsiaKe").textContent = "[   ]";
        } else {
            document.getElementById("pdfValJinsiaMe").textContent = "[   ]";
            document.getElementById("pdfValJinsiaKe").textContent = "[ X ]";
        }

        document.getElementById("pdfValUmri").textContent = data.umri || '';

        const pdfMemberPhoto = document.getElementById("pdfValMemberPhoto");
        const pdfMemberPhotoPlaceholder = document.getElementById("pdfValMemberPhotoPlaceholder");
        if (data.memberPhotoBase64) {
            pdfMemberPhoto.src = data.memberPhotoBase64;
            pdfMemberPhoto.classList.remove("hidden");
            pdfMemberPhotoPlaceholder.classList.add("hidden");
        } else {
            pdfMemberPhoto.classList.add("hidden");
            pdfMemberPhotoPlaceholder.classList.remove("hidden");
        }

        // Page 1: Residence
        document.getElementById("pdfValMkoaUnaloishi").textContent = data.mkoaUnaloishi || '';
        document.getElementById("pdfValWilayaUnaloishi").textContent = data.wilayaUnaloishi || '';
        document.getElementById("pdfValKataUnaloishi").textContent = data.kataUnaloishi || '';
        document.getElementById("pdfValNambaSimu").textContent = data.nambaSimu || '';

        // Page 1: Origin
        document.getElementById("pdfValKataUnayotokea").textContent = data.kataUnayotokea || '';
        document.getElementById("pdfValKijijiUnachotokea").textContent = data.kijijiUnachotokea || '';

        // Page 1: Dependents Table
        const pdfDepBody = document.getElementById("pdfDependentsBody");
        pdfDepBody.innerHTML = "";
        const deps = Array.isArray(data.dependents) ? [...data.dependents] : [];
        const rowCount = Math.max(5, deps.length);
        for (let i = 0; i < rowCount; i++) {
            const row = document.createElement("tr");
            if (i < deps.length) {
                const dep = deps.shift() || {};
                
                const tdName = document.createElement("td");
                tdName.style.textAlign = "left";
                tdName.style.textTransform = "uppercase";
                tdName.textContent = dep.name || '';
                
                const tdRelation = document.createElement("td");
                tdRelation.style.textTransform = "uppercase";
                tdRelation.textContent = dep.relation || '';
                
                const tdAge = document.createElement("td");
                tdAge.textContent = dep.age || '';
                
                const tdPhone = document.createElement("td");
                tdPhone.textContent = dep.phone || '-';
                
                const tdPhoto = document.createElement("td");
                const divPhoto = document.createElement("div");
                divPhoto.className = "pdf-dep-photo-slot";
                if (dep.photoBase64) {
                    const img = document.createElement("img");
                    img.src = dep.photoBase64;
                    img.className = "pdf-dep-photo-img";
                    divPhoto.appendChild(img);
                } else {
                    const ph = document.createElement("div");
                    ph.className = "pdf-dep-photo-placeholder";
                    ph.textContent = "Picha";
                    divPhoto.appendChild(ph);
                }
                tdPhoto.appendChild(divPhoto);
                
                row.appendChild(tdName);
                row.appendChild(tdRelation);
                row.appendChild(tdAge);
                row.appendChild(tdPhone);
                row.appendChild(tdPhoto);
            } else {
                for (let j = 0; j < 4; j++) {
                    const td = document.createElement("td");
                    td.textContent = "\u00A0";
                    row.appendChild(td);
                }
                const tdPhoto = document.createElement("td");
                const divPhoto = document.createElement("div");
                divPhoto.className = "pdf-dep-photo-slot";
                const ph = document.createElement("div");
                ph.className = "pdf-dep-photo-placeholder";
                ph.textContent = "Weka picha";
                divPhoto.appendChild(ph);
                tdPhoto.appendChild(divPhoto);
                row.appendChild(tdPhoto);
            }
            pdfDepBody.appendChild(row);
        }

        // Page 2: Next of Kin
        const nok = Array.isArray(data.nok) ? [...data.nok] : [];
        for (let i = 0; i < 4; i++) {
            const idx = i + 1;
            const item = nok.shift() || {};
            document.getElementById(`pdfValNokJina_${idx}`).textContent = item.jina || '';
            document.getElementById(`pdfValNokSimu_${idx}`).textContent = item.simu || '';
            document.getElementById(`pdfValNokUhusiano_${idx}`).textContent = item.uhusiano || '';
        }

        // Page 2: Wadhamini
        const wad = Array.isArray(data.wadhamini) ? [...data.wadhamini] : [];
        for (let i = 0; i < 2; i++) {
            const idx = i + 1;
            const item = wad.shift() || {};
            document.getElementById(`pdfValWadhaminiJina_${idx}`).textContent = item.jina || '';
            document.getElementById(`pdfValWadhaminiSimu_${idx}`).textContent = item.simu || '';
            document.getElementById(`pdfValWadhaminiUhusiano_${idx}`).textContent = item.uhusiano || '';
        }

        // Page 2: Signature and Date
        const pdfMemberSig = document.getElementById("pdfValMemberSignature");
        if (data.signatureBase64) {
            pdfMemberSig.src = data.signatureBase64;
            pdfMemberSig.classList.remove("hidden");
        } else {
            pdfMemberSig.classList.add("hidden");
        }

        const sainiDate = data.tareheSaini;
        if (sainiDate) {
            const d = new Date(sainiDate);
            const formattedDate = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
            document.getElementById("pdfValTareheSaini").textContent = formattedDate;
        } else {
            document.getElementById("pdfValTareheSaini").textContent = "........................";
        }
    }

    // --- SAVE REGISTRATION TO DATABASE API ---
    const API_URL = window.location.origin + '/api';

    async function saveRegistration(regData) {
        const response = await fetch(`${API_URL}/registrations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(regData)
        });
        if (!response.ok) {
            throw new Error('Imeshindwa kuhifadhi taarifa kwenye server.');
        }
        return await response.json();
    }

    // --- GENERATE PDF FROM SAVED DATA ---
    async function generatePdfFromData(data, filename) {
        // Populate the hidden PDF template
        populatePdfFromData(data);

        // Wait for images to fully load
        await new Promise(resolve => setTimeout(resolve, 1000));

        const pdfElement = document.getElementById("pdf-template");
        
        // Ensure all images are loaded before generating PDF
        const images = pdfElement.querySelectorAll('img');
        await Promise.all(Array.from(images).map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise(resolve => {
                img.onload = resolve;
                img.onerror = resolve; // Continue even if image fails to load
            });
        }));
        
        const options = {
            margin: 0,
            filename: filename || `FOMU_YA_MWANAKIKUNDI_${data.jinaKwanza || 'UNKNOWN'}_${data.jinaTatu || 'UNKNOWN'}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                letterRendering: true,
                logging: false,
                scrollY: 0,
                scrollX: 0,
                windowWidth: 794,
                windowHeight: null
            },
            jsPDF: {
                unit: 'pt',
                format: 'a4',
                orientation: 'portrait'
            },
            pagebreak: { mode: ['css', 'legacy'] }
        };

        await html2pdf().set(options).from(pdfElement).save();
    }

    // --- FINAL FORM SUBMISSION & PDF GENERATION ---
    const submitFormBtn = document.getElementById("submitFormBtn");
    const statusIndicator = document.getElementById("statusIndicator");
    const statusMessage = document.getElementById("statusMessage");
    const finalPrevBtn = document.getElementById("finalPrevBtn");

    submitFormBtn.addEventListener("click", async () => {
        // Validation check
        if (!validateStep(5)) {
            return;
        }

        // Ensure signature is drawn
        if (signaturePad.isEmpty()) {
            alert("Tafadhali saini fomu ili uweze kukamilisha.");
            canvas.style.borderColor = "var(--color-danger)";
            return;
        }

        // Show spinner loader, disable buttons
        submitFormBtn.disabled = true;
        finalPrevBtn.disabled = true;
        statusIndicator.classList.remove("hidden");
        statusMessage.textContent = "Inaandaa taarifa kwa ajili ya PDF...";

        try {
            // Build the registration data object
            const regData = buildRegistrationData();

            // Save the registration data to IndexedDB
            await saveRegistration(regData);

            statusMessage.textContent = "Taarifa zimehifadhiwa, inatengeneza PDF...";

            // Populate the PDF template from the data
            populatePdfFromData(regData);

            // Small delay to make sure UI updates and images render
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Select the template container
            const pdfElement = document.getElementById("pdf-template");

            // Ensure all images are loaded before generating PDF
            const images = pdfElement.querySelectorAll('img');
            await Promise.all(Array.from(images).map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise(resolve => {
                    img.onload = resolve;
                    img.onerror = resolve; // Continue even if image fails to load
                });
            }));

            // Configure html2pdf options
            const options = {
                margin: 0,
                filename: `FOMU_YA_MWANAKIKUNDI_TUSAIDIANE_${regData.jinaKwanza}_${regData.jinaTatu}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: {
                    scale: 2,
                    useCORS: true,
                    letterRendering: true,
                    logging: false,
                    scrollY: 0,
                    scrollX: 0,
                    windowWidth: 794,
                    windowHeight: null
                },
                jsPDF: {
                    unit: 'pt',
                    format: 'a4',
                    orientation: 'portrait'
                },
                pagebreak: { mode: ['css', 'legacy'] }
            };

            statusMessage.textContent = "Inatengeneza faili la PDF na kupakua...";

            // Run html2pdf download promise
            await html2pdf().set(options).from(pdfElement).save();

            statusMessage.textContent = "PDF imepakuliwa kwa mafanikio!";
            statusIndicator.style.borderColor = "var(--color-success)";

            setTimeout(() => {
                alert("Fomu yako imekamilishwa na PDF imepakuliwa! Asante.");
                location.reload(); // Reset form
            }, 1500);

        } catch (error) {
            console.error("PDF Generation error: ", error);
            alert("Hitilafu imetokea wakati wa kutengeneza PDF. Tafadhali jaribu tena.");
            submitFormBtn.disabled = false;
            finalPrevBtn.disabled = false;
            statusIndicator.classList.add("hidden");
        }
    });

    // --- POPULATE PDF TEMPLATE (Legacy - uses current form inputs) ---
    function populatePdfTemplate() {
        populatePdfFromData(buildRegistrationData());
    }
});

// ============================================================
// ADMIN PORTAL LOGIC (Must be outside DOMContentLoaded for global access)
// ============================================================

// Admin credentials (hardcoded, can be changed)
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "msiba2026";

// Admin session state
let adminLoggedIn = false;
let allRegistrations = [];

// --- Show / Hide Admin Login Modal ---
function showAdminLogin() {
    document.getElementById("adminLoginModal").classList.remove("hidden");
    document.getElementById("loginErrorMessage").classList.add("hidden");
    document.getElementById("adminUsername").value = "";
    document.getElementById("adminPassword").value = "";
    document.getElementById("adminUsername").focus();
}

function hideAdminLogin() {
    document.getElementById("adminLoginModal").classList.add("hidden");
}

// --- Handle Admin Login ---
function handleAdminLogin() {
    const username = document.getElementById("adminUsername").value.trim();
    const password = document.getElementById("adminPassword").value.trim();

    if (username.toLowerCase() === ADMIN_USERNAME.toLowerCase() && password === ADMIN_PASSWORD) {
        adminLoggedIn = true;
        hideAdminLogin();
        showAdminDashboard();
    } else {
        document.getElementById("loginErrorMessage").classList.remove("hidden");
    }
}

// --- Handle Admin Logout ---
function handleAdminLogout() {
    adminLoggedIn = false;
    document.getElementById("adminDashboardCard").classList.add("hidden");
    document.getElementById("formCard").classList.remove("hidden");
}

// --- Show Admin Dashboard ---
async function showAdminDashboard() {
    document.getElementById("formCard").classList.add("hidden");
    document.getElementById("adminDashboardCard").classList.remove("hidden");

    // Load all registrations from Backend API
    try {
        const response = await fetch(`${window.location.origin}/api/registrations`);
        if (response.ok) {
            allRegistrations = await response.json();
            renderAdminTable(allRegistrations);
            updateAdminStats(allRegistrations);
        } else {
            console.error("Failed to load registrations from API");
            allRegistrations = [];
            renderAdminTable(allRegistrations);
        }
    } catch (err) {
        console.error("Failed to fetch registrations for admin:", err);
        allRegistrations = [];
        renderAdminTable(allRegistrations);
    }
}

function updateAdminStats(registrations) {
    const total = registrations.length;
    document.getElementById("totalRegistrations").textContent = total;
}

// --- Render Admin Table ---
function renderAdminTable(registrations) {
    const tbody = document.getElementById("adminTableBody");
    tbody.innerHTML = "";

    if (!registrations || registrations.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-muted);">Hakuna wanachama waliojisajili bado.</td></tr>`;
        return;
    }

    registrations.forEach((reg, index) => {
        const tr = document.createElement("tr");
        const displayName = reg.fullName || `${reg.jinaKwanza || ''} ${reg.jinaPili || ''} ${reg.jinaTatu || ''}`.trim() || '---';

        // Format date
        let dateStr = '---';
        if (reg.tareheSaini) {
            const d = new Date(reg.tareheSaini);
            dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
        } else if (reg.timestamp) {
            const d = new Date(reg.timestamp);
            dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
        }

        const tdIndex = document.createElement("td");
        tdIndex.textContent = index + 1;

        const tdName = document.createElement("td");
        tdName.style.textTransform = "uppercase";
        tdName.style.fontWeight = "600";
        tdName.textContent = displayName;

        const tdPhone = document.createElement("td");
        tdPhone.textContent = reg.nambaSimu || '---';

        const tdDate = document.createElement("td");
        tdDate.textContent = dateStr;

        const tdActions = document.createElement("td");
        const divActions = document.createElement("div");
        divActions.className = "admin-actions-cell";

        const btnView = document.createElement("button");
        btnView.type = "button";
        btnView.className = "btn btn-primary btn-icon";
        btnView.title = "Angalia taarifa";
        btnView.onclick = () => viewRegistration(reg.id);
        btnView.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg> Angalia';
        divActions.appendChild(btnView);

        const btnPdf = document.createElement("button");
        btnPdf.type = "button";
        btnPdf.className = "btn btn-success btn-icon";
        btnPdf.title = "Pakua PDF";
        btnPdf.onclick = () => downloadAdminPdf(reg.id);
        btnPdf.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> PDF';
        divActions.appendChild(btnPdf);

        const btnDelete = document.createElement("button");
        btnDelete.type = "button";
        btnDelete.className = "btn btn-danger btn-icon";
        btnDelete.title = "Futa";
        btnDelete.onclick = () => deleteRegistrationRecord(reg.id);
        btnDelete.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg> Futa';
        divActions.appendChild(btnDelete);

        tdActions.appendChild(divActions);

        tr.appendChild(tdIndex);
        tr.appendChild(tdName);
        tr.appendChild(tdPhone);
        tr.appendChild(tdDate);
        tr.appendChild(tdActions);
        tbody.appendChild(tr);
    });
}

// --- Filter Registrations by Search ---
function filterRegistrations() {
    const searchTerm = document.getElementById("adminSearchInput").value.trim().toLowerCase();
    if (!searchTerm) {
        renderAdminTable(allRegistrations);
        updateAdminStats(allRegistrations);
        return;
    }

    const filtered = allRegistrations.filter(reg => {
        const name = (reg.fullName || `${reg.jinaKwanza || ''} ${reg.jinaPili || ''} ${reg.jinaTatu || ''}`).toLowerCase();
        const phone = (reg.nambaSimu || '').toLowerCase();
        return name.includes(searchTerm) || phone.includes(searchTerm);
    });

    renderAdminTable(filtered);
    document.getElementById("totalRegistrations").textContent = filtered.length + " (imechujwa)";
}

// --- View Registration Details ---
function viewRegistration(id) {
    const reg = allRegistrations.find(r => r.id === id);
    if (!reg) {
        alert("Taarifa hazipatikani.");
        return;
    }

    // Build a detailed view string (displayed in alert for simplicity)
    let msg = "======= TAARIFA ZA MWANAKIKUNDI =======\n\n";
    msg += `Jina Kamili: ${reg.fullName || `${reg.jinaKwanza || ''} ${reg.jinaPili || ''} ${reg.jinaTatu || ''}`.trim()}\n`;
    msg += `Jinsia: ${reg.jinsia || '---'}\n`;
    msg += `Umri: ${reg.umri || '---'}\n`;
    msg += `Namba ya Simu: ${reg.nambaSimu || '---'}\n`;
    msg += `\n--- Makazi ---\n`;
    msg += `Mkoa: ${reg.mkoaUnaloishi || '---'}\n`;
    msg += `Wilaya: ${reg.wilayaUnaloishi || '---'}\n`;
    msg += `Kata: ${reg.kataUnaloishi || '---'}\n`;
    msg += `\n--- Asili Rombo ---\n`;
    msg += `Kata: ${reg.kataUnayotokea || '---'}\n`;
    msg += `Kijiji: ${reg.kijijiUnachotokea || '---'}\n`;

    // Dependents
    if (reg.dependents && reg.dependents.length > 0) {
        msg += `\n--- Wategemezi (${reg.dependents.length}) ---\n`;
        reg.dependents.forEach((d, i) => {
            msg += `${i + 1}. ${d.name} - ${d.relation}, umri ${d.age}, simu ${d.phone || '-'}\n`;
        });
    }

    msg += `\n--- Mtu wa Karibu ---\n`;
    if (reg.nok) {
        reg.nok.forEach((n, i) => {
            if (n.jina) msg += `${i + 1}. ${n.jina} - ${n.simu || '-'} (${n.uhusiano || '-'})\n`;
        });
    }

    msg += `\n--- Wadhamini ---\n`;
    if (reg.wadhamini) {
        reg.wadhamini.forEach((w, i) => {
            if (w.jina) msg += `${i + 1}. ${w.jina} - ${w.simu || '-'} (${w.uhusiano || '-'})\n`;
        });
    }

    msg += `\nTarehe ya Saini: ${reg.tareheSaini || '---'}`;
    msg += `\nMuda wa Usajili: ${reg.timestamp ? new Date(reg.timestamp).toLocaleString() : '---'}\n`;

    alert(msg);
}

// --- Download Admin PDF ---
async function downloadAdminPdf(id) {
    const reg = allRegistrations.find(r => r.id === id);
    if (!reg) {
        alert("Taarifa hazipatikani kwa ajili ya PDF.");
        return;
    }

    // Generate filename
    const fname = `FOMU_YA_MWANAKIKUNDI_${reg.jinaKwanza || 'UNKNOWN'}_${reg.jinaTatu || 'UNKNOWN'}.pdf`;

    try {
        // We need to populate the PDF template from this data then download
        // Create a temporary reference to the pdf-template element
        const pdfElement = document.getElementById("pdf-template");
        if (!pdfElement) {
            alert("PDF template haipatikani.");
            return;
        }

        // Populate using the global function that's set up in DOMContentLoaded
        // We'll handle this by directly calling the same populate logic
        // This data object structure matches what populatePdfFromData expects
        const data = reg;

        // Set values on the hidden PDF template
        document.getElementById("pdfValJinaKwanza").textContent = data.jinaKwanza || '';
        document.getElementById("pdfValJinaPili").textContent = data.jinaPili || '';
        document.getElementById("pdfValJinaTatu").textContent = data.jinaTatu || '';

        if (data.jinsia === "Mwanaume") {
            document.getElementById("pdfValJinsiaMe").textContent = "[ X ]";
            document.getElementById("pdfValJinsiaKe").textContent = "[   ]";
        } else {
            document.getElementById("pdfValJinsiaMe").textContent = "[   ]";
            document.getElementById("pdfValJinsiaKe").textContent = "[ X ]";
        }

        document.getElementById("pdfValUmri").textContent = data.umri || '';

        // Photo
        const pdfMemberPhoto = document.getElementById("pdfValMemberPhoto");
        const pdfMemberPhotoPlaceholder = document.getElementById("pdfValMemberPhotoPlaceholder");
        if (data.memberPhotoBase64) {
            pdfMemberPhoto.src = data.memberPhotoBase64;
            pdfMemberPhoto.classList.remove("hidden");
            pdfMemberPhotoPlaceholder.classList.add("hidden");
        } else {
            pdfMemberPhoto.classList.add("hidden");
            pdfMemberPhotoPlaceholder.classList.remove("hidden");
        }

        document.getElementById("pdfValMkoaUnaloishi").textContent = data.mkoaUnaloishi || '';
        document.getElementById("pdfValWilayaUnaloishi").textContent = data.wilayaUnaloishi || '';
        document.getElementById("pdfValKataUnaloishi").textContent = data.kataUnaloishi || '';
        document.getElementById("pdfValNambaSimu").textContent = data.nambaSimu || '';
        document.getElementById("pdfValKataUnayotokea").textContent = data.kataUnayotokea || '';
        document.getElementById("pdfValKijijiUnachotokea").textContent = data.kijijiUnachotokea || '';

        // Dependents table
        const pdfDepBody = document.getElementById("pdfDependentsBody");
        pdfDepBody.innerHTML = "";
        const deps = Array.isArray(data.dependents) ? [...data.dependents] : [];
        const rowCount = Math.max(5, deps.length);
        for (let i = 0; i < rowCount; i++) {
            const row = document.createElement("tr");
            if (i < deps.length) {
                const dep = deps.shift() || {};
                
                const tdName = document.createElement("td");
                tdName.style.textAlign = "left";
                tdName.style.textTransform = "uppercase";
                tdName.textContent = dep.name || '';
                
                const tdRelation = document.createElement("td");
                tdRelation.style.textTransform = "uppercase";
                tdRelation.textContent = dep.relation || '';
                
                const tdAge = document.createElement("td");
                tdAge.textContent = dep.age || '';
                
                const tdPhone = document.createElement("td");
                tdPhone.textContent = dep.phone || '-';
                
                const tdPhoto = document.createElement("td");
                const divPhoto = document.createElement("div");
                divPhoto.className = "pdf-dep-photo-slot";
                if (dep.photoBase64) {
                    const img = document.createElement("img");
                    img.src = dep.photoBase64;
                    img.className = "pdf-dep-photo-img";
                    divPhoto.appendChild(img);
                } else {
                    const ph = document.createElement("div");
                    ph.className = "pdf-dep-photo-placeholder";
                    ph.textContent = "Picha";
                    divPhoto.appendChild(ph);
                }
                tdPhoto.appendChild(divPhoto);
                
                row.appendChild(tdName);
                row.appendChild(tdRelation);
                row.appendChild(tdAge);
                row.appendChild(tdPhone);
                row.appendChild(tdPhoto);
            } else {
                for (let j = 0; j < 4; j++) {
                    const td = document.createElement("td");
                    td.textContent = "\u00A0";
                    row.appendChild(td);
                }
                const tdPhoto = document.createElement("td");
                const divPhoto = document.createElement("div");
                divPhoto.className = "pdf-dep-photo-slot";
                const ph = document.createElement("div");
                ph.className = "pdf-dep-photo-placeholder";
                ph.textContent = "Weka picha";
                divPhoto.appendChild(ph);
                tdPhoto.appendChild(divPhoto);
                row.appendChild(tdPhoto);
            }
            pdfDepBody.appendChild(row);
        }

        // NOK
        const nok = Array.isArray(data.nok) ? [...data.nok] : [];
        for (let i = 0; i < 4; i++) {
            const idx = i + 1;
            const item = nok.shift() || {};
            document.getElementById(`pdfValNokJina_${idx}`).textContent = item.jina || '';
            document.getElementById(`pdfValNokSimu_${idx}`).textContent = item.simu || '';
            document.getElementById(`pdfValNokUhusiano_${idx}`).textContent = item.uhusiano || '';
        }

        // Wadhamini
        const wad = Array.isArray(data.wadhamini) ? [...data.wadhamini] : [];
        for (let i = 0; i < 2; i++) {
            const idx = i + 1;
            const item = wad.shift() || {};
            document.getElementById(`pdfValWadhaminiJina_${idx}`).textContent = item.jina || '';
            document.getElementById(`pdfValWadhaminiSimu_${idx}`).textContent = item.simu || '';
            document.getElementById(`pdfValWadhaminiUhusiano_${idx}`).textContent = item.uhusiano || '';
        }

        // Signature
        const pdfMemberSig = document.getElementById("pdfValMemberSignature");
        if (data.signatureBase64) {
            pdfMemberSig.src = data.signatureBase64;
            pdfMemberSig.classList.remove("hidden");
        } else {
            pdfMemberSig.classList.add("hidden");
        }

        if (data.tareheSaini) {
            const d = new Date(data.tareheSaini);
            const formattedDate = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
            document.getElementById("pdfValTareheSaini").textContent = formattedDate;
        } else {
            document.getElementById("pdfValTareheSaini").textContent = "........................";
        }

        await new Promise(resolve => setTimeout(resolve, 500));

        const options = {
            margin: 0,
            filename: fname,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true, logging: false, scrollY: 0, scrollX: 0 },
            jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['css', 'legacy'] }
        };

        await html2pdf().set(options).from(pdfElement).save();
    } catch (err) {
        console.error("Admin PDF download error:", err);
        alert("Hitilafu imetokea wakati wa kupakua PDF. Tafadhali jaribu tena.");
    }
}

// --- Delete Registration ---
async function deleteRegistrationRecord(id) {
    if (!confirm("Una uhakika unataka kufuta taarifa hizi? Hatua hii haiwezi kutenduliwa!")) {
        return;
    }

    try {
        const response = await fetch(`${window.location.origin}/api/registrations/${id}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            showAdminDashboard(); // Refresh table
        } else {
            alert("Hitilafu imetokea wakati wa kufuta kwenye server.");
        }
    } catch (err) {
        console.error("Delete error:", err);
        alert("Hitilafu imetokea wakati wa kufuta. Hakikisha server ipo hewani.");
    }
}

// --- Export to CSV ---
function exportToCsv() {
    if (!allRegistrations || allRegistrations.length === 0) {
        alert("Hakuna taarifa za kuhamisha.");
        return;
    }

    // Build CSV
    let csv = "Na.,Jina Kamili,Jinsia,Umri,Simu,Mkoa,Wilaya,Kata,NambaSimu,KataAsili,KijijiAsili,IdadiWategemezi,TareheSaini\n";
    allRegistrations.forEach((reg, i) => {
        const name = reg.fullName || `${reg.jinaKwanza || ''} ${reg.jinaPili || ''} ${reg.jinaTatu || ''}`.trim();
        const depCount = (reg.dependents || []).length;
        csv += `${i + 1},"${name}",${reg.jinsia || ''},${reg.umri || ''},${reg.nambaSimu || ''},${reg.mkoaUnaloishi || ''},${reg.wilayaUnaloishi || ''},${reg.kataUnaloishi || ''},${reg.nambaSimu || ''},${reg.kataUnayotokea || ''},${reg.kijijiUnachotokea || ''},${depCount},${reg.tareheSaini || ''}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Wanachama_Tusaidiame_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
}