import { Link } from 'react-router-dom';

function Footer(){
    return(
        <footer id="footer" className="footer position-relative light-background">
  <div className="container footer-top">
    <div className="row gy-4">
      <div className="col-lg-4 col-md-6 footer-about">
      <Link to="/home" className="logo d-flex align-items-center">
          <span className="sitename">ConfidentVoice</span>
        </Link>
        <div className="footer-contact pt-3">
        <p>Mangaluru</p>
        <p>Karnataka, India</p>
          <p><strong>Phone:</strong> +1 (123) 456-7890</p>
          <p><strong>Email:</strong> support@confidentvoice.ai</p>
        </div>
      </div>
      <div className="col-lg-2 col-md-3 footer-links">
              <h4>Useful Links</h4>
              <ul>
                <li><Link to="/home">Home</Link></li>
                <li><Link to="/about">About Us</Link></li>
                
              </ul>
            </div>
    </div>
  </div>
</footer>
    );

}
export default Footer;