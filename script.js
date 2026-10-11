document.addEventListener('DOMContentLoaded', () => {
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.module-section');
    const moduleTitle = document.getElementById('current-module-title');
    const moduleSubtitle = document.getElementById('current-module-subtitle');

    const moduleInfo = {
        simulator: { title: "Interactive Packet Fragmentation Simulator", subtitle: "Experiment with packet sizes, MTU, headers, offsets, and MF flags in real-time." },
        diagram: { title: "Visual Router Packet Flow & Reassembly Journey", subtitle: "Step through the life of an IPv4 packet crossing a constrained MTU link." },
        calculator: { title: "Step-by-Step Calculation Engine", subtitle: "Examine the mathematical breakdown behind IPv4 fragmentation formulas." },
        examples: { title: "5 Fully Worked Exam-Style Examples", subtitle: "Complete tables and calculations for standard networking scenarios." },
        practice: { title: "Exam Practice Mode", subtitle: "Test your mastery with 20 original questions across 3 difficulty tiers." },
        mistakes: { title: "Avoid These Exam Mistakes", subtitle: "Learn how to spot and correct the 6 most common student pitfalls." },
        revision: { title: "Quick Revision Sheet", subtitle: "Printable summary of formulas, definitions, and reference tables." },
        glossary: { title: "Networking & Cybersecurity Glossary", subtitle: "Key definitions demystified for students." }
    };

    const completedModules = new Set(['simulator']);

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-target');
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            sections.forEach(sec => sec.classList.remove('active'));
            document.getElementById(target).classList.add('active');

            if (moduleInfo[target]) {
                moduleTitle.textContent = moduleInfo[target].title;
                moduleSubtitle.textContent = moduleInfo[target].subtitle;
            }

            completedModules.add(target);
            const pct = Math.round((completedModules.size / 8) * 100);
            document.getElementById('overall-progress').style.width = `${pct}%`;
            document.getElementById('progress-text').textContent = `${completedModules.size}/8 modules completed`;
        });
    });

    initSimulator();
    initDiagram();
    initCalculator();
    initExamples();
    initQuiz();
    initGlossary();

    document.getElementById('btn-print').addEventListener('click', () => window.print());
});

/* SIMULATOR */
function initSimulator() {
    const totalInput = document.getElementById('sim-total-len');
    const headerInput = document.getElementById('sim-header-len');
    const mtuInput = document.getElementById('sim-mtu');
    const resultsContainer = document.getElementById('simulation-results');

    document.getElementById('btn-fragment').addEventListener('click', runSimulation);
    document.getElementById('btn-reset').addEventListener('click', () => {
        totalInput.value = 4000;
        headerInput.value = 20;
        mtuInput.value = 1500;
        runSimulation();
    });

    document.querySelectorAll('.btn-preset').forEach(btn => {
        btn.addEventListener('click', () => {
            totalInput.value = btn.getAttribute('data-total');
            headerInput.value = btn.getAttribute('data-header');
            mtuInput.value = btn.getAttribute('data-mtu');
            runSimulation();
        });
    });

    function runSimulation() {
        const totalLen = parseInt(totalInput.value);
        const headerLen = parseInt(headerInput.value);
        const mtu = parseInt(mtuInput.value);

        resultsContainer.innerHTML = '';

        if (isNaN(totalLen) || isNaN(headerLen) || isNaN(mtu)) {
            resultsContainer.innerHTML = `<div class="warning-box">❌ Please enter valid numerical values.</div>`;
            return;
        }
        if (headerLen < 20 || headerLen > 60 || headerLen % 4 !== 0) {
            resultsContainer.innerHTML = `<div class="warning-box">⚠️ IPv4 Header length must be between 20 and 60 bytes and a multiple of 4.</div>`;
            return;
        }
        if (totalLen <= headerLen) {
            resultsContainer.innerHTML = `<div class="warning-box">⚠️ Total length must be greater than header length.</div>`;
            return;
        }
        if (mtu <= headerLen) {
            resultsContainer.innerHTML = `<div class="warning-box">❌ MTU (${mtu}) is too small to accommodate the IPv4 header (${headerLen} bytes). Fragmentation impossible!</div>`;
            return;
        }

        const originalPayload = totalLen - headerLen;
        const maxFragPayload = Math.floor((mtu - headerLen) / 8) * 8;

        if (maxFragPayload <= 0) {
            resultsContainer.innerHTML = `<div class="warning-box">❌ MTU (${mtu}) leaves insufficient space for a valid 8-byte aligned payload. Fragmentation impossible.</div>`;
            return;
        }

        let html = `
            <div class="packet-block-container">
                <div class="packet-block-title">
                    <span>📦 Original IPv4 Datagram</span>
                    <span>Total Length: ${totalLen}B | Payload: ${originalPayload}B</span>
                </div>
                <div class="visual-packet-bar">
                    <div class="segment-header" style="width: ${Math.max(10, (headerLen/totalLen)*100)}%;">Header (${headerLen}B)</div>
                    <div class="segment-payload" style="width: ${Math.max(20, (originalPayload/totalLen)*100)}%;">Payload (${originalPayload}B)</div>
                </div>
            </div>
        `;

        if (totalLen <= mtu) {
            html += `<div class="warning-box">✔️ Packet length (${totalLen}B) ≤ MTU (${mtu}B). <strong>No fragmentation required!</strong></div>`;
            resultsContainer.innerHTML = html;
            return;
        }

        let remaining = originalPayload;
        let offsetBytes = 0;
        let fragNum = 1;

        html += `<h4 style="margin: 20px 0 10px 0; color: var(--accent-cyan);">Generated Fragments</h4>`;

        while (remaining > 0) {
            let pSize = Math.min(remaining, maxFragPayload);
            let mf = (remaining - pSize > 0) ? 1 : 0;
            let fragTotalLen = headerLen + pSize;
            let offsetUnits = offsetBytes / 8;

            html += `
                <div class="packet-block-container">
                    <div class="packet-block-title">
                        <span>🧩 Fragment #${fragNum} ${mf === 1 ? '(MF = 1, More Follow)' : '(MF = 0, Final Fragment)'}</span>
                        <span>Payload Bytes: ${offsetBytes} – ${offsetBytes + pSize - 1}</span>
                    </div>
                    <div class="visual-packet-bar">
                        <div class="segment-header" style="width: ${Math.max(15, (headerLen/fragTotalLen)*100)}%;">Header (${headerLen}B)</div>
                        <div class="segment-payload" style="width: ${Math.max(30, (pSize/fragTotalLen)*100)}%;">Payload (${pSize}B)</div>
                    </div>
                    <div class="fragment-meta-grid">
                        <div class="meta-pill"><span>Total Length</span><strong>${fragTotalLen} bytes</strong></div>
                        <div class="meta-pill"><span>Header Length</span><strong>${headerLen} bytes</strong></div>
                        <div class="meta-pill"><span>Payload Length</span><strong>${pSize} bytes</strong></div>
                        <div class="meta-pill"><span>Fragment Offset</span><strong>${offsetUnits}</strong> <span>(${offsetBytes} bytes)</span></div>
                        <div class="meta-pill"><span>MF Flag</span><strong>${mf}</strong></div>
                    </div>
                </div>
            `;

            offsetBytes += pSize;
            remaining -= pSize;
            fragNum++;
        }

        resultsContainer.innerHTML = html;
    }

    runSimulation();
}

/* ROUTER DIAGRAM */
function initDiagram() {
    let step = 1;
    const container = document.getElementById('diagram-canvas-container');
    const explanation = document.getElementById('diagram-explanation');

    const steps = [
        {
            title: "Step 1: Original Datagram Creation",
            desc: "Sender generates a 4000-byte IPv4 packet (20B header, 3980B payload) with DF = 0.",
            render: `<div style="text-align:center;">🖥️ Sender Host<br><br><span style="background:var(--bg-card); padding:12px; border-radius:8px; border:1px solid var(--accent-blue);">Original Packet (4000 Bytes)</span></div>`
        },
        {
            title: "Step 2: Router Receives Packet",
            desc: "Packet arrives at a router interface with an outgoing link MTU of 1500 bytes. 4000B > 1500B MTU.",
            render: `<div style="text-align:center;">📦 Packet (4000B) ➡️ 🛜 Router (Interface MTU = 1500B)</div>`
        },
        {
            title: "Step 3: Calculating 8-Byte Aligned Payload Chunks",
            desc: "Max Fragment Payload = floor((1500 - 20)/8) * 8 = 1480 bytes. Split: 1480B + 1480B + 1020B.",
            render: `<div style="text-align:center;">✂️ Chunks: Payload 1 = 1480B | Payload 2 = 1480B | Payload 3 = 1020B</div>`
        },
        {
            title: "Step 4: Stamping Fragment Headers & Offsets",
            desc: "Frag 1: Offset=0, MF=1 | Frag 2: Offset=185, MF=1 | Frag 3: Offset=370, MF=0.",
            render: `<div style="text-align:center;">🏷️ Headers attached with Offsets (0, 185, 370) and MF flags.</div>`
        },
        {
            title: "Step 5: Reassembly at Destination Host",
            desc: "Destination receives all fragments, buffers them, sorts by Fragment Offset, and reassembles the original datagram.",
            render: `<div style="text-align:center;">🎉 Destination Host reassembles 3980B payload + 20B header successfully!</div>`
        }
    ];

    function update() {
        container.innerHTML = steps[step - 1].render;
        explanation.innerHTML = `<strong>${steps[step - 1].title}</strong><br>${steps[step - 1].desc}`;
        document.getElementById('diag-step-indicator').textContent = `Step ${step} of 5`;
    }

    document.getElementById('diag-prev').addEventListener('click', () => { if (step > 1) { step--; update(); } });
    document.getElementById('diag-next').addEventListener('click', () => { if (step < 5) { step++; update(); } });

    update();
}

/* CALCULATION ENGINE */
function initCalculator() {
    document.getElementById('btn-calculate-engine').addEventListener('click', () => {
        const total = parseInt(document.getElementById('calc-total').value);
        const header = parseInt(document.getElementById('calc-header').value);
        const mtu = parseInt(document.getElementById('calc-mtu').value);
        const output = document.getElementById('engine-output');

        if (isNaN(total) || isNaN(header) || isNaN(mtu) || total <= header || mtu <= header) {
            output.innerHTML = `<div class="warning-box">Please enter valid parameters where Total > Header and MTU > Header.</div>`;
            return;
        }

        const origPayload = total - header;
        const maxPayload = Math.floor((mtu - header) / 8) * 8;

        let html = `
            <div class="calc-step-card">
                <h5>Step 1: Calculate Original Payload</h5>
                <p>Formula: Original Payload = Total Length − Header Length</p>
                <p>Substitution: ${total} − ${header} = <strong>${origPayload} bytes</strong></p>
            </div>
            <div class="calc-step-card">
                <h5>Step 2: Determine Max Fragment Payload (8-byte alignment rule)</h5>
                <p>Formula: floor((MTU − Header) / 8) × 8</p>
                <p>Substitution: floor((${mtu} − ${header}) / 8) × 8 = <strong>${maxPayload} bytes</strong></p>
            </div>
        `;

        let rem = origPayload;
        let off = 0;
        let num = 1;

        while (rem > 0) {
            let pSize = Math.min(rem, maxPayload);
            let mf = (rem - pSize > 0) ? 1 : 0;
            let offUnits = off / 8;

            html += `
                <div class="calc-step-card">
                    <h5>Fragment #${num}</h5>
                    <p>Payload = min(${rem}, ${maxPayload}) = <strong>${pSize} bytes</strong></p>
                    <p>Total Length = Header (${header}) + Payload (${pSize}) = <strong>${header + pSize} bytes</strong></p>
                    <p>Fragment Offset = ${off} / 8 = <strong>${offUnits}</strong> (8-byte units)</p>
                    <p>MF Flag = <strong>${mf}</strong></p>
                </div>
            `;

            off += pSize;
            rem -= pSize;
            num++;
        }

        output.innerHTML = html;
    });
}

/* WORKED EXAMPLES */
function initExamples() {
    const tabs = document.querySelectorAll('.tab-btn');
    const content = document.getElementById('example-content-area');

    const examples = {
        1: { title: "Example 1: 4000B Datagram, 20B Header, 1500B MTU", rows: [[1,1480,20,1500,0,1],[2,1480,20,1500,185,1],[3,1020,20,1040,370,0]] },
        2: { title: "Example 2: 2400B Datagram, 20B Header, 1000B MTU", rows: [[1,976,20,996,0,1],[2,976,20,996,122,1],[3,428,20,448,244,0]] },
        3: { title: "Example 3: 2000B Datagram, 20B Header, 600B MTU", rows: [[1,576,20,596,0,1],[2,576,20,596,72,1],[3,576,20,596,144,1],[4,252,20,272,216,0]] },
        4: { title: "Example 4: 1500B Datagram, 20B Header, 576B MTU", rows: [[1,552,20,572,0,1],[2,552,20,572,69,1],[3,376,20,396,138,0]] },
        5: { title: "Example 5: Datagram with Non-Multiple Final Fragment", rows: [[1,1480,20,1500,0,1],[2,153,20,173,185,0]] }
    };

    function render(id) {
        const ex = examples[id];
        let html = `<h4 style="color:var(--accent-cyan);">${ex.title}</h4>
        <table class="fragment-table">
            <thead><tr><th>Frag #</th><th>Payload (B)</th><th>Header (B)</th><th>Total Len (B)</th><th>Offset</th><th>MF</th></tr></thead>
            <tbody>`;
        ex.rows.forEach(r => {
            html += `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td><td><strong>${r[5]}</strong></td></tr>`;
        });
        html += `</tbody></table>`;
        content.innerHTML = html;
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            render(tab.getAttribute('data-ex'));
        });
    });

    render(1);
}

/* QUIZ */
function initQuiz() {
    const questions = [
        { q: "What does MTU stand for?", options: ["Maximum Transmission Unit", "Minimum Transport Utility", "Multi-Threaded Unit"], answer: 0, diff: "Beginner", expl: "MTU stands for Maximum Transmission Unit." },
        { q: "What is the unit of measurement for IPv4 Fragment Offset?", options: ["Bytes", "8-byte blocks", "Bits"], answer: 1, diff: "Beginner", expl: "Fragment offset is measured in 8-byte units." },
        { q: "If prior payload sent is 1480 bytes, what is the Fragment Offset?", options: ["1480", "185", "1500"], answer: 1, diff: "Intermediate", expl: "1480 / 8 = 185." },
        { q: "What does MF = 0 indicate?", options: ["Final fragment", "First fragment", "Error"], answer: 0, diff: "Beginner", expl: "MF = 0 means no more fragments follow." },
        { q: "True or False: The final fragment payload must be a multiple of 8 bytes.", options: ["True", "False"], answer: 1, diff: "Intermediate", expl: "False. Only non-final payloads must be multiples of 8." }
    ];

    let qIdx = 0;
    let score = 0;
    let attempted = 0;

    const quizContainer = document.getElementById('quiz-container');
    const feedback = document.getElementById('quiz-feedback');
    const submitBtn = document.getElementById('btn-submit-answer');
    const nextBtn = document.getElementById('btn-next-question');

    function loadQ() {
        feedback.className = 'quiz-feedback hidden';
        submitBtn.classList.remove('hidden');
        nextBtn.classList.add('hidden');

        const q = questions[qIdx];
        document.getElementById('q-current-num').textContent = qIdx + 1;
        document.getElementById('q-diff-badge').textContent = q.diff;

        let html = `<div class="quiz-question-text">Q${qIdx + 1}. ${q.q}</div><div class="quiz-options-list">`;
        q.options.forEach((opt, i) => {
            html += `<label class="quiz-option-label"><input type="radio" name="q-opt" value="${i}"> <span>${opt}</span></label>`;
        });
        html += `</div>`;
        quizContainer.innerHTML = html;
    }

    submitBtn.addEventListener('click', () => {
        const sel = quizContainer.querySelector('input[name="q-opt"]:checked');
        if (!sel) return alert("Select an answer!");

        const userAns = parseInt(sel.value);
        const q = questions[qIdx];
        const correct = userAns === q.answer;

        attempted++;
        if (correct) score++;

        document.getElementById('score-display').textContent = score;
        document.getElementById('total-attempted').textContent = attempted;

        feedback.className = `quiz-feedback ${correct ? 'correct' : 'incorrect'}`;
        feedback.innerHTML = `<strong>${correct ? '✔️ Correct!' : '❌ Incorrect.'}</strong><br>${q.expl}`;
        feedback.classList.remove('hidden');

        submitBtn.classList.add('hidden');
        nextBtn.classList.remove('hidden');
    });

    nextBtn.addEventListener('click', () => {
        qIdx = (qIdx + 1) % questions.length;
        loadQ();
    });

    loadQ();
}

/* GLOSSARY */
function initGlossary() {
    const terms = [
        { term: "MTU (Maximum Transmission Unit)", def: "Largest total packet size a physical network interface can transmit without fragmentation." },
        { term: "Fragment Offset", def: "Field specifying position of fragment payload in 8-byte units relative to the original datagram." },
        { term: "MF Flag (More Fragments)", def: "1-bit flag indicating whether more fragments follow (1) or if this is the last fragment (0)." },
        { term: "DF Flag (Don't Fragment)", def: "1-bit flag instructing routers to drop the packet rather than fragmenting it if MTU is exceeded." }
    ];

    let html = "";
    terms.forEach(t => {
        html += `<div class="glossary-item"><h4>${t.term}</h4><p>${t.def}</p></div>`;
    });
    document.getElementById('glossary-grid').innerHTML = html;
}