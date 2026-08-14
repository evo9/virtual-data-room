import { useEffect, useState } from 'react';

function App() {
    const [api, setApi] = useState('checking...')

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL}/health`)
            .then(r => r.json())
            .then(d => setApi(d.status))
            .catch(() => setApi('unreachable'))
    }, [])

    return (
        <div className="p-8">
            <p>Status: {api}</p>
        </div>
    );
}

export default App;
