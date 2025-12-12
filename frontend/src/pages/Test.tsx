import logoVideo from '../assets/generated_images/logo_intro.mp4';

const Test = () =>{
    return(
        <>
        <div className="container" style={{ 
            backgroundColor: '#000',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <video 
                src={logoVideo} 
                autoPlay 
                muted 
                loop 
                playsInline
                style={{ 
                    width: '90%', 
                    maxWidth: '800px',
                }}
            />
            <p style={{ color: '#fff', marginTop: '20px', textAlign: 'center' }}>
                Note: For transparent background, replace logo_intro.mp4 with logo_intro.webm (WebM format with alpha channel)
            </p>
        </div>
        </>
    )
}

export default Test;