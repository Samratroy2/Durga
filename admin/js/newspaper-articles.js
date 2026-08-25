/* =========================================================
   ROY BARI — OLD PICTURES ADMIN
   Firestore collection: oldPictures
   ========================================================= */

import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    Timestamp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";

import { db } from "../firebase.js";


const COLLECTION = "oldPictures";

const FIELDS = [
    {
        "name": "title",
        "label": "Title",
        "type": "text",
        "required": true,
        "placeholder": "Roy Bari Durga Puja"
    },
    {
        "name": "category",
        "label": "Category",
        "type": "text",
        "required": false,
        "placeholder": "Puja"
    },
    {
        "name": "year",
        "label": "Year",
        "type": "number",
        "required": false,
        "placeholder": "2021"
    },
    {
        "name": "description",
        "label": "Description",
        "type": "textarea",
        "required": false,
        "placeholder": "2021 Durga idol"
    },
    {
        "name": "image",
        "label": "Image URL",
        "type": "url",
        "required": false,
        "placeholder": "Google Drive or image URL"
    }
];

const DISPLAY_FIELD = "title";

let records = [];
let selectedId = null;
let editing = false;


const list = document.getElementById("documentList");
const count = document.getElementById("documentCount");
const form = document.getElementById("editorForm");
const fieldsBox = document.getElementById("fields");
const formTitle = document.getElementById("formTitle");
const documentId = document.getElementById("documentId");
const message = document.getElementById("message");
const saveButton = document.getElementById("saveButton");
const deleteButton = document.getElementById("deleteButton");
const newButton = document.getElementById("newButton");
const cancelButton = document.getElementById("cancelButton");


initialize();


async function initialize() {
    newButton.addEventListener("click", newRecord);
    cancelButton.addEventListener("click", cancelEdit);
    deleteButton.addEventListener("click", deleteRecord);
    form.addEventListener("submit", saveRecord);
    await loadRecords();
}


async function loadRecords() {
    setMessage("Loading...", "message-info");

    try {
        const snapshot = await getDocs(collection(db, COLLECTION));

        records = snapshot.docs.map(item => ({
            id: item.id,
            data: item.data()
        }));

        renderList();

        count.textContent =
            `${records.length} document${records.length === 1 ? "" : "s"}`;

        if (records.length) {
            selectRecord(records[0].id);
        } else {
            newRecord();
        }

        setMessage("", "");
    } catch (error) {
        console.error(`ROY BARI: ${COLLECTION} load error`, error);
        setMessage(errorMessage(error), "message-error");
        list.innerHTML = `<div class="empty-list">Unable to load records.</div>`;
    }
}


function renderList() {
    list.innerHTML = "";

    if (!records.length) {
        list.innerHTML = `<div class="empty-list">No documents found.</div>`;
        return;
    }

    records.forEach(record => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "manager-list-item";
        button.dataset.id = record.id;

        const value = record.data[DISPLAY_FIELD] || "Untitled";

        button.innerHTML = `
            <strong>${escapeHTML(value)}</strong>
            <small>${escapeHTML(record.id)}</small>
        `;

        button.addEventListener("click", () => selectRecord(record.id));
        list.appendChild(button);
    });
}


function selectRecord(id) {
    const record = records.find(item => item.id === id);
    if (!record) return;

    selectedId = id;
    editing = true;

    renderForm(record.data);

    formTitle.textContent = "Edit Document";
    documentId.textContent = `Document ID: ${id}`;

    deleteButton.disabled = false;

    document.querySelectorAll(".manager-list-item").forEach(button => {
        button.classList.toggle("active", button.dataset.id === id);
    });

    setMessage("", "");
}


function newRecord() {
    selectedId = null;
    editing = false;

    renderForm({});

    formTitle.textContent = "New Document";
    documentId.textContent = "A new document will be created";

    deleteButton.disabled = true;

    document.querySelectorAll(".manager-list-item").forEach(button => {
        button.classList.remove("active");
    });

    setMessage("Enter the information and click Save.", "message-info");
}


function cancelEdit() {
    if (selectedId) {
        selectRecord(selectedId);
    } else if (records.length) {
        selectRecord(records[0].id);
    } else {
        newRecord();
    }
}


function renderForm(data) {
    fieldsBox.innerHTML = "";

    FIELDS.forEach(field => {
        const group = document.createElement("div");
        group.className = "form-group";

        const label = document.createElement("label");
        label.htmlFor = `field-${field.name}`;
        label.textContent = field.label;
        group.appendChild(label);

        let input;

        if (field.type === "textarea") {
            input = document.createElement("textarea");
            input.value = data[field.name] ?? "";
        } else if (field.type === "checkbox") {
            const row = document.createElement("div");
            row.className = "checkbox-row";

            input = document.createElement("input");
            input.type = "checkbox";
            input.checked = data[field.name] === true;

            row.appendChild(input);
            group.appendChild(row);
        } else {
            input = document.createElement("input");
            input.type = field.type;

            if (field.type === "datetime-local") {
                input.value = toLocalDateTime(data[field.name]);
            } else {
                input.value = data[field.name] ?? "";
            }
        }

        input.id = `field-${field.name}`;
        input.name = field.name;

        if (field.type !== "checkbox") {
            input.placeholder = field.placeholder || "";
            input.required = !!field.required;
        }

        if (field.type !== "checkbox") {
            group.appendChild(input);
        }

        if (field.name === "dateTime") {
            const help = document.createElement("small");
            help.className = "field-help";
            help.textContent = "Stored in Firestore as a Timestamp.";
            group.appendChild(help);
        }

        if (
            field.name === "image" ||
            field.name === "oldImage" ||
            field.name === "newImage"
        ) {
            const help = document.createElement("small");
            help.className = "field-help";
            help.textContent = "Paste a Google Drive file URL or direct image URL.";
            group.appendChild(help);
        }

        fieldsBox.appendChild(group);
    });
}


async function saveRecord(event) {
    event.preventDefault();

    const data = {};

    for (const field of FIELDS) {
        const input = document.getElementById(`field-${field.name}`);
        if (!input) continue;

        if (field.type === "checkbox") {
            data[field.name] = input.checked;
        } else if (field.type === "number") {
            data[field.name] =
                input.value === "" ? null : Number(input.value);
        } else if (field.type === "datetime-local") {
            data[field.name] =
                input.value ? Timestamp.fromDate(new Date(input.value)) : null;
        } else {
            data[field.name] = input.value.trim();
        }

        if (field.required) {
            const value = data[field.name];
            if (value === "" || value === null || value === undefined) {
                setMessage(`${field.label} is required.`, "message-error");
                input.focus();
                return;
            }
        }
    }

    saveButton.disabled = true;
    deleteButton.disabled = true;
    setMessage("Saving...", "message-info");

    try {
        if (editing && selectedId) {
            await updateDoc(
                doc(db, COLLECTION, selectedId),
                data
            );

            setMessage("Changes saved successfully.", "message-success");
        } else {
            const created = await addDoc(
                collection(db, COLLECTION),
                data
            );

            selectedId = created.id;
            editing = true;

            setMessage("Document created successfully.", "message-success");
        }

        await loadRecords();

        if (selectedId) {
            const exists = records.some(item => item.id === selectedId);
            if (exists) selectRecord(selectedId);
        }
    } catch (error) {
        console.error(`ROY BARI: ${COLLECTION} save error`, error);
        setMessage(errorMessage(error), "message-error");
    } finally {
        saveButton.disabled = false;
        deleteButton.disabled = !editing;
    }
}


async function deleteRecord() {
    if (!editing || !selectedId) return;

    const record = records.find(item => item.id === selectedId);
    const name = record?.data?.[DISPLAY_FIELD] || selectedId;

    if (!confirm(`Delete "${name}"?\n\nThis cannot be undone.`)) {
        return;
    }

    saveButton.disabled = true;
    deleteButton.disabled = true;
    setMessage("Deleting...", "message-info");

    try {
        await deleteDoc(doc(db, COLLECTION, selectedId));

        selectedId = null;
        editing = false;

        setMessage("Document deleted successfully.", "message-success");

        await loadRecords();
    } catch (error) {
        console.error(`ROY BARI: ${COLLECTION} delete error`, error);
        setMessage(errorMessage(error), "message-error");
        saveButton.disabled = false;
        deleteButton.disabled = false;
    }
}


function toLocalDateTime(value) {
    if (!value) return "";

    let date;

    if (typeof value.toDate === "function") {
        date = value.toDate();
    } else if (value instanceof Date) {
        date = value;
    } else if (
        typeof value === "object" &&
        value.seconds !== undefined
    ) {
        date = new Date(Number(value.seconds) * 1000);
    } else {
        date = new Date(value);
    }

    if (Number.isNaN(date.getTime())) return "";

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
}


function setMessage(text, type) {
    message.textContent = text;
    message.className = "message";

    if (type) message.classList.add(type);
}


function errorMessage(error) {
    if (error?.code === "permission-denied") {
        return "Permission denied. Check Firestore security rules.";
    }

    return error?.message || "Something went wrong.";
}


function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


window.addEventListener("beforeunload", () => {
    // No listeners to clean up; Firestore reads are one-time getDocs calls.
});
