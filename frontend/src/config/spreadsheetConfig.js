// Centralized Google Sheets & Drive links configuration
// Values are read from environment variables (prefixed with VITE_) with fallbacks

export const SPREADSHEET_LINKS = {
  // 1. Blacklisted / Debarred Registry Spreadsheet
  blacklistedRegistry:
    import.meta.env.VITE_SHEET_BLACKLISTED_URL ||
    'https://docs.google.com/spreadsheets/d/1VaHBoHdMgSeC5tEfPZZA4VV1S703B4oLNJreDdVa40I/edit?usp=sharing',

  // 2. All Placement Data Google Drive Folder
  placementDrive:
    import.meta.env.VITE_DRIVE_PLACEMENT_URL ||
    'https://drive.google.com/drive/folders/1TH8qfWIIXuux1p9MCMqZ0MD3_7JlzIj7?usp=sharing',

  // 3. Students Database Master Spreadsheet
  studentsDatabase:
    import.meta.env.VITE_SHEET_STUDENTS_DB_URL ||
    'https://docs.google.com/spreadsheets/d/11XeRRSKqICTTqZ_-_g-z1yYnSU_yTiBVFf6fxQBbku8/edit?usp=sharing',

  // 4. Placed Data (Open Link)
  placedDataOpen:
    import.meta.env.VITE_SHEET_PLACED_DATA_URL ||
    'https://docs.google.com/spreadsheets/d/1eiLJQ0l6RjVPSlxjdivoiY2kcDNdFGhkFpVDHYxCTV0/edit?usp=sharing',

  // 5. Placed Data (Embedded iframe Link)
  placedDataEmbed:
    import.meta.env.VITE_SHEET_PLACED_DATA_EMBED_URL ||
    'https://docs.google.com/spreadsheets/d/1eiLJQ0l6RjVPSlxjdivoiY2kcDNdFGhkFpVDHYxCTV0/htmlembed?widget=true&headers=false',
};
