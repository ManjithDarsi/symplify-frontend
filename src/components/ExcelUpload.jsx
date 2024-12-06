import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const ExcelToApiUploader = () => {
  const [file, setFile] = useState(null);
  const [excelData, setExcelData] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState({ employees: [], patients: [] });
  const { clinic_id } = useParams();
  const { toast } = useToast();
  const { authenticatedFetch } = useAuth();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    if (selectedFile) {
      readExcelFile(selectedFile);
    }
  };

  const readExcelFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const employeeSheet = workbook.Sheets['Employee'];
        const patientSheet = workbook.Sheets['Paitients']; // Note: 'Paitients' is misspelled in your Excel sheet

        const employees = XLSX.utils.sheet_to_json(employeeSheet);
        const patients = XLSX.utils.sheet_to_json(patientSheet);
        
        setExcelData({ employees, patients });
        console.log('Excel data parsed:', { employees, patients });
        toast({
          title: "Success",
          description: "Excel file read successfully. Data is ready for upload.",
        });
      } catch (error) {
        console.error('Error parsing Excel file:', error);
        toast({
          title: "Error",
          description: "Failed to parse Excel file. Please check the file format.",
          variant: "destructive",
        });
      }
    };
    reader.onerror = () => {
      toast({
        title: "Error",
        description: "Failed to read the file.",
        variant: "destructive",
      });
    };
    reader.readAsArrayBuffer(file);
  };

  const formatPhoneNumber = (countryCode, phoneNumber) => {
    if (!countryCode || !phoneNumber) return null;
    return `${countryCode}${phoneNumber}`.replace(/\s/g, '');
  };


  const uploadData = async () => {
    if (!excelData) {
      toast({
        title: "Error",
        description: "No data to upload. Please select an Excel file first.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    console.log('Starting data upload...');

    const employeeResults = await Promise.all(excelData.employees.map(async (employee) => {
      try {
        console.log('Processing employee:', employee);
        const formattedEmployee = {
          first_name: employee['First name '] || '',
          last_name: employee['Second name '] || '',
          email: employee['email id '] || '',
          mobile: `+${employee['Country code ']}${employee['Phone number ']}`,
          sex: employee['Gender (M/F)']?.toLowerCase() === 'm' ? 'm' : 'f',
          dob: employee['DOB'] || null,
          is_therapist: true,
          has_app_access: true,
          is_active: true,
        };
        console.log('Formatted employee data:', formattedEmployee);

        const response = await authenticatedFetch(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/employee/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formattedEmployee),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(JSON.stringify(errorData));
        }

        const responseData = await response.json();
        console.log('Employee upload successful:', responseData);
        return { success: true, data: responseData };
      } catch (error) {
        console.error('Error uploading employee:', error);
        return { success: false, error: error.message };
      }
    }));

    const patientResults = await Promise.all(excelData.patients.map(async (patient) => {
      try {
        console.log('Processing patient:', patient, patient['First name ']);
        const formattedPatient = {
          first_name: patient['First name '] || '',
          last_name: patient['Second name '] || '',
          email: patient['email id '] || '',
          mobile: `+${patient['Country code ']}${patient['Phone number ']}`,
          sex: patient['Gender (M/F)']?.trim().toLowerCase() === 'm'
            ? 'm'
            : patient['Gender (M/F)']?.trim().toLowerCase() === 'f'
            ? 'f'
            : null,
          dob: patient['DOB'] || null,
          priority: 9,
          therapist_primary: "647f75af-fa0d-4c0f-b8a6-113d56f9f66a",
          email_alternate: null,
          mobile_alternate: null,
          "guardian_name": null,
          has_app_access: true,
          is_active: true,
        };
        console.log('Formatted patient data:', formattedPatient);

        const response = await authenticatedFetch(`${import.meta.env.VITE_BASE_URL}/api/emp/clinic/${clinic_id}/patient/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formattedPatient),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(JSON.stringify(errorData));
        }

        const responseData = await response.json();
        console.log('Patient upload successful:', responseData);
        return { success: true, data: responseData };
      } catch (error) {
        console.error('Error uploading patient:', error);
        return { success: false, error: error.message };
      }
    }));

    setResults({ employees: employeeResults, patients: patientResults });
    setUploading(false);
    console.log('Data upload completed.');
    toast({
      title: "Upload Complete",
      description: "Data upload process has finished. Check results for details.",
    });
  };

  const renderDataTable = (data, title) => {
    if (!data || data.length === 0) return null;
    const headers = Object.keys(data[0]);
    return (
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr>
                {headers.map((header, index) => (
                  <th key={index} className="px-4 py-2 bg-gray-100 border-b">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 10).map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {headers.map((header, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-2 border-b">{row[header]?.toString() || ''}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.length > 10 && (
          <p className="mt-2 text-sm text-gray-600">Showing first 10 rows of {data.length} total rows.</p>
        )}
      </div>
    );
  };

  const renderResults = () => {
    if (!results.employees.length && !results.patients.length) return null;
    return (
      <div className="mt-6">
        <h3 className="text-xl font-semibold mb-4">Upload Results</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold">Employees:</h4>
            <p>Successful: {results.employees.filter(r => r.success).length}</p>
            <p>Failed: {results.employees.filter(r => !r.success).length}</p>
          </div>
          <div>
            <h4 className="font-semibold">Patients:</h4>
            <p>Successful: {results.patients.filter(r => r.success).length}</p>
            <p>Failed: {results.patients.filter(r => !r.success).length}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full max-w-4xl mx-auto mt-8">
      <CardContent className="pt-6">
        <h2 className="text-2xl font-bold mb-6 text-center">Excel to API Uploader</h2>
        <Input type="file" onChange={handleFileChange} accept=".xlsx, .xls" className="mb-4" />
        {excelData && (
          <>
            <div>
              <h3 className="text-xl font-semibold mb-4">Excel Data Preview</h3>
              {renderDataTable(excelData.employees, "Employees")}
              {renderDataTable(excelData.patients, "Patients")}
            </div>
            <Button 
              onClick={uploadData} 
              disabled={uploading} 
              className="mt-4 w-full"
            >
              {uploading ? 'Uploading...' : 'Upload Data'}
            </Button>
          </>
        )}
        {renderResults()}
      </CardContent>
    </Card>
  );
};

export default ExcelToApiUploader;