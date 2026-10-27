import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ViewHeaderBar from '../components/layout/ViewHeaderBar.jsx';
import SearchForm from '../components/marks/SearchForm.jsx';
import Spinner from '../components/common/Spinner.jsx';
import ProfileCard from '../components/marks/ProfileCard.jsx';
import { useECEStudentsQuery } from '../hooks/useApiQueries.js';

export default function ECEMarks() {
  const navigate = useNavigate();
  const [usnInput, setUsnInput] = useState('');
  const [searchedUsn, setSearchedUsn] = useState('');
  const [validationError, setValidationError] = useState('');

  const { data: eceList, isLoading, error } = useECEStudentsQuery();

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanUsn = usnInput.trim().toUpperCase();
    if (!cleanUsn) return;

    const ECE_USN_REGEX = /^1RF\d{2}EC\d{3}$/;
    if (!ECE_USN_REGEX.test(cleanUsn)) {
      setValidationError('Invalid USN format. Expected format: 1RF23EC001 or 1RF24EC400');
      setSearchedUsn('');
      return;
    }

    setValidationError('');
    setSearchedUsn(cleanUsn);
  };

  const student = searchedUsn && Array.isArray(eceList)
    ? eceList.find((s) => s.usn === searchedUsn)
    : null;

  let notFoundError = '';
  if (searchedUsn && eceList && !student) {
    notFoundError = 'Student record not found in ECE registry.';
  }

  const errorMsg = validationError || notFoundError || (error ? error.message : '');

  return (
    <div className="ece-container">
      <ViewHeaderBar
        onBack={() => navigate('/registry-selector')}
        backLabel="Return to Registry"
        title="ECE Marks Registry"
        subtitle="Official Examination Database Query"
      />

      <SearchForm
        usn={usnInput}
        setUsn={setUsnInput}
        onSubmit={handleSubmit}
        placeholder="Enter USN (e.g. 1RF23EC001)"
        errorMsg={errorMsg}
      />

      <Spinner active={isLoading} />

      <div id="result-container" className={`result-container ${student ? 'active' : ''}`}>
        {student && (
          <ProfileCard
            studentData={{
              usn: student.usn,
              name: student.name,
              cgpa: student.cgpa,
            }}
            semesterCount={1}
            isECE={true}
          />
        )}
      </div>
    </div>
  );
}
