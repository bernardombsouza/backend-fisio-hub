import server from '../app';
const PORT = 5000

server.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));