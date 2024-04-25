const code = document.getElementById('code');
const setup = document.querySelectorAll('.setup');

function generateRandomCode() {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < 4; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}


setup.forEach(btn => {
    btn.addEventListener('click', (e) => {
        let pin = generateRandomCode();
        const clickedButton = e.target;
        // clickedButton.disabled = true;
        const peerId = clickedButton.dataset.peerid;
        const parentDiv = clickedButton.parentElement;
        const startMeeting = parentDiv.querySelector('a');
        startMeeting.setAttribute("href", `/interview?roomId=${pin}`);
        // startMeeting.classList.remove('disabled');
        startMeeting.innerText = `Join: ${pin}`;

        fetch(`/meetingCode?code=${pin}&peerId=${peerId}`, {
            method: 'POST'
        })
            .then(response => response.json()) // Convert response to JSON
            .then(data => {
                console.log('Success:', data);
            })
            .catch((error) => {
                console.error('Error:', error);
            });

        startMeeting.addEventListener('click', () => {

        })
    })
});

