import '../../App.css';
import React, {useEffect, useState} from 'react';
import {getSecretsforUser, deleteSecret} from "../../comunication/FetchSecrets";

const Secrets = ({loginValues}) => {
    const [secrets, setSecrets] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const fetchSecrets = async () => {
            setErrorMessage('');
            if (!loginValues.email) {
                setErrorMessage("No valid email, please log in first.");
                return;
            }
            try {
                const data = await getSecretsforUser(loginValues);
                const parsedData = data.map(secret => ({
                    ...secret,
                    content: JSON.parse(secret.content)
                }));
                setSecrets(parsedData);
            } catch (error) {
                setErrorMessage(error.message);
            }
        };
        fetchSecrets();
    }, [loginValues]);

    const renderContent = (content) => {
        switch (content.kind) {
            case 'note':
                return (
                    <div>
                        <strong>Title:</strong> {content.title}<br/>
                        <strong>Content:</strong> {content.content}
                    </div>
                );
            case 'credential':
                return (
                    <div>
                        <strong>Username:</strong> {content.userName}<br/>
                        <strong>Password:</strong> {content.password}<br/>
                        <strong>URL:</strong> {content.url}
                    </div>
                );
            case 'creditcard':
                return (
                    <div>
                        <strong>Card Type:</strong> {content.cardtype}<br/>
                        <strong>Card Number:</strong> {content.cardnumber}<br/>
                        <strong>Expiration:</strong> {content.expiration}<br/>
                        <strong>CVV:</strong> {content.cvv}
                    </div>
                );
            default:
                return <pre>{JSON.stringify(content, null, 2)}</pre>;
        }
    };

    const onClickDelete = async (id) => {
        try {
            await deleteSecret(id);
            setSecrets(prev => prev.filter(s => s.id !== id));
        } catch (error) {
            setErrorMessage("Could not delete secret: " + error.message);
        }
    };


    return (
        <div>
            <h1>My Secrets</h1>
            {errorMessage && <p style={{color: 'red'}}>{errorMessage}</p>}

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px',
                marginTop: '20px'
            }}>
                {secrets.length > 0 ? (
                    secrets.map(secret => (
                        <div key={secret.id} style={{
                            border: '1px solid #ccc',
                            borderRadius: '8px',
                            padding: '15px',
                            background: '#f9f9f9',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                        }}>
                            <div><strong>Secret ID:</strong> {secret.id}</div>
                            <div><strong>User ID:</strong> {secret.userId}</div>
                            <hr style={{margin: '10px 0'}}/>
                            {renderContent(secret.content)}
                            <button className="danger" onClick={() => onClickDelete(secret.id)}>
                                Delete
                            </button>
                        </div>
                    ))
                ) : (
                    <p>No secrets available</p>
                )}
            </div>
        </div>
    );
};

export default Secrets;
