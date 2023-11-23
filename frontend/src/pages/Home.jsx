import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../assets/css/style.css';
// import logoImage from './assets/sbnc_logo.png';
import { Link } from 'react-router-dom';
// @ts-ignore
import profileIcon from '../assets/images/account (1).png';
// @ts-ignore
import banner from '../assets/images/sbnc_banner.png';
import axios from 'axios';
import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs';

import Spinner from '../components/Spinner';
import DataEntryForm from '../components/DataEntryForm';
import DeleteButton from '../components/DeleteButton';
import UpdateButton from '../components/EditButton';

function Home() {
    const navigate = useNavigate();
    // Loading and Updating Transactions
    const [loading, setLoading] = useState(false);
    const [transactions, setTransactions] = useState([]);
    //Filtering Transactions
    const [defaultStartDate, setDefaultStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());
    const [defaultEndDate, setDefaultEndDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth()+1, 0).toISOString());
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState(defaultStartDate);
    const [endDate, setEndDate] = useState(defaultEndDate);
    //Dropdowns and Popups
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [isDataEntryOpen, setIsDataEntryOpen] = useState(false);
    const [isRowClicked, setIsRowClicked] = useState([false, -1]);
    //User Variables
    const[currentUser, setCurrentUser] = useState("");
    const[transactionCount, setTransactionCount] = useState(0);

    // [CREATE] When Data Entry Submit Button is Clicked
    const handleDataEntrySubmit = (formData) => {
        axios.post('http://localhost:8080/transactions', formData, {withCredentials: true})
        .then((res) => {
                console.log('Transaction Posted:', res.data);
                fetchAndUpdateTransactions();
            })
            .catch((err) => {
                alert("Error submitting new transactions data");
                console.error('Error submitting data:', err.message);
            });
        setIsDataEntryOpen(false);
    };

    // [READ] Call this function when fetching Transactions from the server
    const fetchAndUpdateTransactions = () => {
        axios.get(`http://localhost:8080/transactions/${startDate}/${endDate}`, { withCredentials: true})
        .then((res) => {
            setTransactions(res.data);
            setLoading(false);
          })
          .catch((err) => {
            console.error(err.message);
            setLoading(false);
          });
    };

    // [Update] Call this function when updating a row
    const handleRowUpdate = (transactionID) => {
        console.log(`Row updated with ID: ${transactionID}`);
        alert(`Update Button on Transaction ID:  [${transactionID}] clicked`);
    };

    // [DELETE] Call this function when deleting a row
    const handleRowDelete = (transactionID) => {
        const userConfirmed = window.confirm('Are you sure you want to delete?');
        if (userConfirmed) {  
            axios.delete(`http://localhost:8080/transactions/${transactionID}`, {withCredentials: true})
                .then((res) => {
                    console.log("Transaction Deleted", res.data);
                    fetchAndUpdateTransactions();
                }).catch((err) => {
                    console.error(err.message);
                });
                console.log(`Row deleted with ID: ${transactionID}`);
        }       
    };

    // [DOWNLOAD] Function used for turning filteredTransactions into an Excel File
    const handleOnExport = async () => {
        if (filteredTransactions && filteredTransactions.length > 0 &&
            window.confirm('Download Current Spreadsheet?')) {
            const wb = new ExcelJS.Workbook();
            const ws = wb.addWorksheet('Transactions');

            ws.columns = [
                {header: "DATE", key: "date", width: 30},
                {header: "BRANCH", key: "branch", width: 30},
                {header: "NAME OF CUSTOMER", key: "name", width: 30},
                {header: "C-SERIES", key: "series", width: 30},
                {header: "OS", key: "os", width: 30},
                {header: "C-INVOICE", key: "invoice", width: 30},
                {header: "SELLER", key: "seller", width: 30},
                {header: "ASSEMBLER", key: "assembler", width: 30},
                {header: "TOTAL", key: "total", width: 30},
                {header: "VAT SALE", key: "vatsale", width: 30},
                {header: "VAT AMOUNT", key: "vatamount", width: 30},
            ];

            // Set fill color and font color for column headers
            ws.getRow(1).eachCell((cell) => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'ff0c2075' }, 
                };
                cell.font = {
                    bold: true,
                    color: { argb: 'ffffffff' }, 
                };
            });

            filteredTransactions.forEach((transaction) => {
                ws.addRow({
                    date: transaction.date,
                    branch: transaction.branch,
                    name: transaction.name,
                    series: transaction.series,
                    os: transaction.os,
                    invoice: transaction.invoice,
                    seller: transaction.seller,
                    assembler: transaction.assembler,
                    total: transaction.total,
                    vatsale: transaction.vatsale,
                    vatamount: transaction.vatamount 
                });
            });

            ws.eachRow((row, rowNumber) => {
                row.alignment = { vertical: 'middle', horizontal: 'center' };
            });

            const blob = await wb.xlsx.writeBuffer();
            saveAs(new Blob([blob]), 'transactions.xlsx');
        }
    };

    // [LOGOUT] Logs out the user
    const handleLogout = () => {
        axios.delete('http://localhost:8080/logout', { withCredentials: true })
            .then((res) => {
                console.log('Logout successful:', res.data);
                navigate('/');
            })
            .catch((err) => {
                console.error('Error during logout:', err.message);
            });
    };

    // When Data Entry Cancel Button is clicked
    const handleDataEntryCancel = () => {
        setIsDataEntryOpen(false);
    };

    // function used for Filtering
    const filteredTransactions = transactions.filter((transaction) => {
        const transactionValues = Object.values(transaction);
        
        return (
            transactionValues.some((value) =>
                value.toString().toLowerCase().includes(searchTerm.toLowerCase())
            )
        )
    }); 

    // Filter the table based on datae
    useEffect(() => {
        setLoading(true);
        fetchAndUpdateTransactions();
    }, [startDate, endDate]);

    // Verify if user is indeed authenticated
    useEffect(() => {
        axios.get('http://localhost:8080/user', { withCredentials: true })
            .then((res) => {
                setDefaultStartDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());
                setDefaultEndDate(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString());
                if (res.data) {
                    console.log("Currently Logged In: ", res.data.user.name);
                    setCurrentUser(res.data.user);
                }     
            })
            .catch((err) => {
                navigate("/");
                console.error(err.message);
            });
    }, [navigate]);

    useEffect(() => {
        setTransactionCount(filteredTransactions.length);
    }, [filteredTransactions]);

    return (
        <div>
            <div className="nav">
            <img className='banner' src={banner} alt="" />
            <Link to='/home'><button className="btn-nav">Transactions</button></Link>
            <Link to='/user-management'><button className="btn-nav">Users</button></Link>
                <div className="profile" onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}>
                    <img src={profileIcon} alt="" />
                </div>
                {isProfileDropdownOpen && (
                    <div className="profile-dropdown">
                        <ul>
                            <li>Profile</li>
                            <li onClick={handleLogout}>Logout</li>
                        </ul>
                    </div>
                )}
            </div>
            <h2 className='greetings'>Welcome {currentUser.
            // @ts-ignore
            name}!</h2>
            <div className='search'>
            <div className='total-container'><h3>Sales Count</h3><h4>{transactionCount}</h4></div>
                <input className='search-input'
                    type="text"
                    placeholder="Search"
                    value={searchTerm}
                    onChange={(e) => {setSearchTerm(e.target.value);}}
                />
                <div className='date'>
                    <div className='startDate'>  <p className='startLabel'>Start Date</p>
                        <input
                            type="date"
                            placeholder="Start Date"
                            value={startDate}
                            onChange={(e) => {e.target.value === '' ? setStartDate(defaultStartDate) : setStartDate(e.target.value)}}
                        /></div>

                    <div className='endDate'>
                        <p className='endLabel'>End Date</p>
                        <input
                            type="date"
                            placeholder="End Date"
                            value={endDate}
                            onChange={(e) => {e.target.value === '' ? setEndDate(defaultEndDate) : setEndDate(e.target.value)}}
                        />
                    </div>

                </div>
                <button className='transac-btn main-buttons' onClick={() => setIsDataEntryOpen(!isDataEntryOpen)}>Add Transaction</button></div>
                {isDataEntryOpen && (<DataEntryForm onSubmit={handleDataEntrySubmit} onCancel={handleDataEntryCancel} 
                // @ts-ignore
                branch={currentUser.branch} currUser={currentUser.name}/>)}
                    {loading ? (<Spinner />) : (<table className="transaction-table">
                        <thead>
                            <tr>
                                <th className='operations'></th>
                                <th>Date</th>
                                <th>Branch</th>
                                <th>Name of Customer</th>
                                <th>C-Series</th>
                                <th>OS</th>
                                <th>C-Invoice</th>
                                <th>Seller</th>
                                <th>Assembler</th>
                                <th>Total</th>
                                <th>VAT Sale</th>
                                <th>VAT Amount</th>
                                <th>Added By</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                filteredTransactions.map((transaction, index) => (
                                <tr key={transaction._id} onClick={()=> setIsRowClicked([!isRowClicked[0], index])}>
                                    {(isRowClicked[0] && isRowClicked[1] === index) ? 
                                    (<td className='operations'>
                                    <UpdateButton onEdit={() => handleRowUpdate(transaction._id)} />{"                "}
                                    <DeleteButton onDelete={() => handleRowDelete(transaction._id)}/></td>) : 
                                    (<td className='operations'></td>)}
                                    <td>{transaction.date}</td>
                                    <td>{transaction.branch}</td>
                                    <td>{transaction.name}</td>
                                    <td>{transaction.series}</td>
                                    <td>{transaction.os}</td>
                                    <td>{transaction.invoice}</td>
                                    <td>{transaction.seller}</td>
                                    <td>{transaction.assembler}</td>
                                    <td>{transaction.total}</td>
                                    <td>{transaction.vatsale}</td>
                                    <td>{transaction.vatamount}</td>
                                    <td>{transaction.addedby}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>)}
            <button className='spreadsheet-btn main-buttons' onClick={handleOnExport}>Download Spreadsheet</button>
        </div>

    );
}

export default Home;