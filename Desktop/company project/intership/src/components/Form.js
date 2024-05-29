import React, { useState, useEffect, useRef } from 'react';
import './Form.css';
import { toWords } from 'number-to-words';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';

function Form() {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [scannedLocation, setScannedLocation] = useState('');
  const [message, setMessage] = useState('');
  const [isDestinationFocused, setIsDestinationFocused] = useState(false);
  const qrScannerRef = useRef(null);
  const [loding,setloding] = useState(true);



  // fetching Api
  useEffect(() => {
    async function fetchItems() {
      const response = await fetch('https://api-staging.inveesync.in/test/get-items');
      const items = await response.json();
      setItems(items);
      setloding(false);
    }
    fetchItems();
  }, []);
  // fetching Api


// by useeffect setting unit according to the sellected item
  useEffect(() => {
    if (selectedItem) {
      const item = items.find(item => item.item_name === selectedItem);
      setUnit(item ? item.unit : '');
    }
  }, [selectedItem, items]);
  // by useeffect setting unit according to the sellected item


  // scanner part logic
  useEffect(() => {
    if (isDestinationFocused && qrScannerRef.current === null) {
      qrScannerRef.current = new Html5QrcodeScanner(
        "reader",
        {
          fps: 10,
          qrbox: 250,
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          aspectRatio: 1.0,
        },
        false
      );
      qrScannerRef.current.render(handleScan);
    }
  }, [isDestinationFocused]);

  const handleScan = (decodedText) => {
    if (decodedText) {
      setScannedLocation(decodedText);
      setIsDestinationFocused(false); // Hide QR scanner after successful scan
      if (qrScannerRef.current) {
        qrScannerRef.current.clear();
      }
    }
  };
  // scanner part logic


  // after submit work like toaster and errors and post on api
  const handleSubmit = async (e) => {
    e.preventDefault();
    const item = items.find(item => item.item_name === selectedItem);
    const allowedLocations = item?.allowed_locations || [];
    if (item && allowedLocations.includes(scannedLocation)) {
      try {
        const response = await fetch('https://api-staging.inveesync.in/test/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify([{ id: item.id, item_name: item.item_name, location: scannedLocation }]),
        });
        const result = await response.json();
        setMessage(`Item moved to ${scannedLocation}`);
        toast.success('Item moved successfully.');
        setSelectedItem('');
        setQuantity('');
        setUnit('');
        setScannedLocation('');
        setMessage('');
      } catch (error) {
        setMessage('Failed to move item. Please try again.');
        toast.error('Failed to move item. Please try again.');
      }
    } else {
      setMessage('Incorrect location. Please try again.');
      toast.error('Incorrect location. Please try again.');
    }

  };
  // after submit work like toaster and errors and post on api



  const handleDestinationFocus = () => {
    setIsDestinationFocused(true);
  };


  // Html structure
  return (
   <>
   {loding ? <>Loading...</> : (
    <form onSubmit={handleSubmit}>
      <div id="cont1">
        <label htmlFor="item">Select Item:</label>
        <select id="item" name="item" value={selectedItem} onChange={(e) => setSelectedItem(e.target.value)}>
          <option value="">Select an item</option>
          {items.map((item) => (
            <option key={item.id} value={item.item_name}>
              {item.item_name}
            </option>
          ))}
        </select>
        <div id="outerdiv">
          <div id="innerdiv">
            <label htmlFor="quantity">Quantity:</label>
            <input type="number" id="quantity" name="quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </div>
          <div id="innerdiv">
            <label htmlFor="unit">Unit:</label>
            <input type="text" id="unit" name="unit" value={unit} readOnly />
          </div>
        </div>
        {quantity !== '' && (
          <p id="inttonum">{toWords(quantity)}</p>
        )}
      </div>
      <div id="cont1">
        <label htmlFor="destination">Scan Destination Location:</label>
        <input 
          type="text" 
          id="destination" 
          name="destination" 
          value={scannedLocation} 
          onFocus={handleDestinationFocus} 
          readOnly 
        />
        {isDestinationFocused && (
          <>
            <div id="reader" style={{ width: '100%' }}></div>
          </>
        )}
        <button type="submit">Submit</button>
        {message && <p className="message">{message}</p>}
        <ToastContainer />
      </div>
    </form>
   )}
    </>
  );
}
// html structure


export default Form;