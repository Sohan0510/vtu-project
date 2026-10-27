import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ViewHeaderBar from '../components/layout/ViewHeaderBar.jsx';
import SearchForm from '../components/marks/SearchForm.jsx';
import Spinner from '../components/common/Spinner.jsx';
import ProfileCard from '../components/marks/ProfileCard.jsx';
import BacklogDetails from '../components/marks/BacklogDetails.jsx';
import SemesterNav from '../components/marks/SemesterNav.jsx';
import MarksTable from '../components/marks/MarksTable.jsx';
import { useStudentResultQuery } from '../hooks/useApiQueries.js';

function getSemFromCode(code) {
  for (const ch of code) {
    if (ch >= '0' && ch <= '9') return parseInt(ch);
  }
  return 0;
}

export default function CSEMarks() {
  const navigate = useNavigate();
  const [usnInput, setUsnInput] = useState('');
  const [searchedUsn, setSearchedUsn] = useState('');
  const [validationError, setValidationError] = useState('');
  const [activeSem, setActiveSem] = useState('all');

  const { data: studentData, isLoading, error } = useStudentResultQuery(searchedUsn);

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanUsn = usnInput.trim().toUpperCase();
    if (!cleanUsn) return;

    const CSE_USN_REGEX = /^1RF\d{2}CS\d{3}$/;
    if (!CSE_USN_REGEX.test(cleanUsn)) {
      setValidationError('Invalid USN format. Expected format: 1RF23CS001 or 1RF24CS400');
      setSearchedUsn('');
      return;
    }

    setValidationError('');
    setActiveSem('all');
    setSearchedUsn(cleanUsn);
  };

  // Group subjects by semester
  const semGroups = {};
  if (studentData && studentData.subjects) {
    Object.entries(studentData.subjects).forEach(([code, s]) => {
      const sem = s.semester || getSemFromCode(code);
      if (!semGroups[sem]) semGroups[sem] = [];
      semGroups[sem].push({ code, ...s });
    });
  }

  const sortedSems = Object.keys(semGroups).sort((a, b) => Number(a) - Number(b));
  const semsToShow = activeSem === 'all' ? sortedSems : [String(activeSem)];
  const errorMsg = validationError || (error ? error.message : '');

  return (
    <div className="cse-container">
      <ViewHeaderBar
        onBack={() => navigate('/registry-selector')}
        backLabel="Return to Registry"
        title="CSE Marks Registry"
        subtitle="Official Examination Database Query"
      />

      <SearchForm
        usn={usnInput}
        setUsn={setUsnInput}
        onSubmit={handleSubmit}
        placeholder="Enter USN (e.g. 1RF22CS001)"
        errorMsg={errorMsg}
      />

      <Spinner active={isLoading} />

      <div id="result-container" className={`result-container ${studentData ? 'active' : ''}`}>
        {studentData && (
          <>
            <ProfileCard
              studentData={studentData}
              semesterCount={sortedSems.length}
              isECE={false}
            />
            <BacklogDetails studentData={studentData} />
            <SemesterNav
              semesters={sortedSems}
              activeSem={activeSem}
              onSelectSem={(s) => setActiveSem(s)}
            />
            <MarksTable
              semsToShow={semsToShow}
              semGroups={semGroups}
              sgpaMap={studentData.sgpa_map}
            />
          </>
        )}
      </div>
    </div>
  );
}
