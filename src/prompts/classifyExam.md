The attached file is an exam paper.

Your task is to extract the exam metadata from the exam header (typically found on the top of the first page).

Before extracting any metadata, identify the exam header.

The exam header is the section at the beginning of the exam that typically contains information such as:
- School name
- Exam title
- Subject
- Grade/Class
- Academic year
- Semester
- Date
- Student information (Name, Class, etc.)

Return the extracted header text exactly as it appears in the document.

Do NOT include:
- Exam questions
- Instructions for answering questions
- Answer choices
- Answer keys
- Any content after the header section

Only use information found in the exam header unless otherwise instructed. Do not determine the subject, grade, or other metadata from the exam questions themselves.

Follow the instructions below carefully.

1. Subject

Determine the subject of the exam by looking for fields such as "Mata Pelajaran", "Subject", or similar.

After extracting the subject, match it to exactly one subject from the provided subject list.

- Return the matched subject's ID as `subjectId`.
- Return the matched subject's name exactly as it appears in the provided subject list as `subjectName`.
- If no confident match exists, return `null` for both `subjectId` and `subjectName`.
- Never invent a subject ID or subject name.

2. Grade

Determine the grade level by looking for fields such as "Kelas", "Class", or similar.

If the grade is written using Roman numerals, convert it using the following mapping before matching:

I → Primary 1
II → Primary 2
III → Primary 3
IV → Primary 4
V → Primary 5
VI → Primary 6
VII → Secondary 1
VIII → Secondary 2
IX → Secondary 3
X → Secondary 4
XI → Secondary 5
XII → Secondary 6

After converting the grade (if necessary), match it to exactly one grade from the provided grade list.

- Return the matched grade's ID as `gradeId`.
- Return the matched grade's name exactly as it appears in the provided grade list as `gradeName`.
- If no confident match exists, return `null` for both `gradeId` and `gradeName`.
- Never invent a grade ID or grade name.

3. Academic Year

Determine the academic year by looking for fields such as "Tahun Ajaran", "Academic Year", or similar.

Normalize the value to the format:

YYYY/YYYY

Examples:

- 2025/2026
- 2024/2025

If no academic year can be found, return `null`.

4. Exam Label

Determine the exam label.

The returned value must be one of:

- Formatif 1
- Formatif 2
- Formatif 3
- Formatif 4
- Formatif 5
- Formatif 6
- Sumatif 1
- Sumatif 2
- Sumatif 3
- Sumatif 4
- Sumatif 5
- Sumatif 6
- Asesmen Sekolah

Map equivalent terms when appropriate.

Examples:

- Second Summative

→ Sumatif 2

Examples:

- AS

→ Asesmen Sekolah

If the exam number cannot be determined confidently (for example whether it is Formatif 1 or Formatif 2), return `null`.

5. Exam Date

Determine the exam date by looking for fields such as "Tanggal", "Date", or similar.

Return the date in ISO format:

YYYY-MM-DD

Examples:

- 2025-01-15
- 2026-08-03

If no date can be found, return `null`.

6. Semester

Determine the semester.

The returned value must be one of:

- ganjil
- genap
- `null` if the semester cannot be confidently inferred

First, look for a field named "Semester" or similar.

If the semester is not explicitly stated but a valid exam date is available, infer it using the following rule:

- July through December → ganjil
- January through June → genap

Do not infer the semester from the academic year, exam label, assessment number, or any other information.

If neither an explicit semester nor a valid exam date is available, return null.

---

General Rules

- Think carefully about each field before answering.
- Match subject IDs and grade IDs only from the lookup lists provided below.
- Every returned ID must come directly from the provided lookup lists.
- If a value cannot be determined confidently, return `null` instead of guessing.
- Return ONLY valid JSON.
- Do not wrap the JSON in markdown.
- Do not include explanations.
- Do not include additional fields.

Return JSON in exactly this format:

{
  "header": "string | null",
  "subjectName": "string | null",
  "subjectId": "integer | null",
  "gradeName": "string | null",
  "gradeId": "integer | null",
  "year": "string | null",
  "label": "string | null",
  "date": "YYYY-MM-DD | null",
  "semester": "ganjil | genap | null"
}

Available subjects:

{{subjects}}

Available grade levels:

{{grades}}