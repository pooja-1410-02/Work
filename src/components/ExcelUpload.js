import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';

const AddExcel = () => {
  const [file, setFile] = useState(null);
  const [ploMapping, setPloMapping] = useState({});
  const [processorMapping, setProcessorMapping] = useState({});

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const fetchMappings = async () => {
    try {
      const [ploResponse, processorResponse] = await Promise.all([
        axios.get('/api/api/plo/'),
        axios.get('/api/api/processor/'),
      ]);

      const ploMap = {};
      ploResponse.data.forEach(plo => {
        ploMap[plo.name] = plo.id;
      });

      const processorMap = {};
      processorResponse.data.forEach(processor => {
        processorMap[processor.name] = processor.id;
      });

      setPloMapping(ploMap);
      setProcessorMapping(processorMap);
    } catch (error) {
      toast.error('Error fetching mappings.');
      console.error("Error fetching mappings:", error);
    }
  };

  const formatDate = (dateValue) => {
    return dateValue ? new Date(dateValue).toISOString() : null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!file) {
      toast.error('Please select a file to upload.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const transformedData = jsonData.map(row => ({
        requested_date: formatDate(row.requested_date),
        flavour: row.flavour,
        sid: row.sid,
        estimated_clients: row.estimated_clients,
        delivered_clients: row.delivered_clients,
        bfs: row.bfs,
        t_shirt_size: row.t_shirt_size,
        system_type: row.system_type || 'unknown',
        hardware: row.hardware,
        setup: row.setup,
        ploId: ploMapping[row.plo] || null,
        processorId: processorMapping[row.processor1] || null,
        processor2Id: processorMapping[row.processor2] || null,
        status: row.status,
        landscape: row.landscape,
        description: row.description,
        expected_delivery: formatDate(row.expected_delivery),
        revised_delivery_date: formatDate(row.revised_delivery_date),
        delivery_date: formatDate(row.delivery_date),
        delivery_delay_reason: row.delivery_delay_reason,
        servicenow: row.servicenow || '',
        comments: row.comments || '',
      }));

      const formData = new FormData();
      formData.append('file', file);

      try {
        const authToken = localStorage.getItem('authToken');
        await axios.post('http://127.0.0.1:8000/api/upload-excel/', formData, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'multipart/form-data',
          },
        });
        toast.success("Excel file uploaded successfully!");
        setFile(null);
      } catch (error) {
        const errorMessage = error.response?.data?.error || 'Error uploading Excel file.';
        toast.error(errorMessage);
        console.error("Upload error:", error);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  useEffect(() => {
    fetchMappings();
  }, []);

  return (
    <div className="add-excel-container">
      <h2>Add Excel File</h2>
      <form onSubmit={handleSubmit}>
        <input 
          type="file" 
          accept=".xlsx, .xls" 
          onChange={handleFileChange} 
          required 
        />
        <button type="submit">Upload</button>
      </form>
    </div>
  );
};

export default AddExcel;
