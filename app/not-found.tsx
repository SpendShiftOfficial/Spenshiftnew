import Header from "@/components/Header";
import Link from "next/link";
import FooterlogoImage from "next/image";
import NotFoundaa from "next/image";
import {
  FaFacebook,
  FaInstagram,
} from "react-icons/fa6";
import { FaTiktok } from "react-icons/fa";

export default function NotFound() {
  return (
    <div>
      <Header />
    
    <div style={{padding:"100px",textAlign:"center"}}>
      <NotFoundaa
                  src="/reportsicon.png"
                  alt="SpendShift"
                  width={180}
                  height={180}
                  priority
                />
      <h1>Reports not found</h1>
      <p>This report may have expired or does not exist.</p>
    </div>
    <footer className="footer">
  <div className="container footerGrid">
    <div className="footerBrand">
      <div className="footerLogo">
        <Link href="/" className="logo">
          <FooterlogoImage
            src="/logo.png"
            alt="SpendShift"
            width={180}
            height={50}
            priority
          />
        </Link>
      </div>

      <p>
        SpendShift helps Australians uncover hidden money leaks, reduce
        unnecessary spending, and build smarter financial habits with
        personalised AI-powered savings insights.
      </p>

      <div className="socials">
  <Link href="https://facebook.com/spendshiftofficial" target="_blank">
    <FaFacebook size={20} />
  </Link>

  <Link href="https://instagram.com/spendshiftofficial" target="_blank">
    <FaInstagram size={20} />
  </Link>

 <Link href="https://www.tiktok.com/@spendshiftofficial" target="_blank">
    <FaTiktok size={20} />
  </Link>

</div>
    </div>

    <div>
      <h4>Quick Links</h4>

      <Link href="#audit">How it Works</Link>
      <Link href="#works">What You Get</Link>
      <Link href="#why">Why SpendShift</Link>
      <Link href="#pricing">Pricing</Link>
      <Link href="#faq">FAQ</Link>
    </div>

    <div>
      <h4>Services</h4>

      <Link href="#audit">Audit Assessment</Link>
      <Link href="/dashboard">Savings Dashboard</Link>
      <Link href="/report">Finance Reporting</Link>
    </div>

    <div>
      <h4>Legal</h4>

      <Link href="/privacy-policy">Privacy Policy</Link>
      <Link href="/terms-and-conditions">Terms & Conditions</Link>
      <Link href="/cookies">Cookie Policy</Link>
    </div>

    <div>
      <h4>Contact</h4>

      <Link href="mailto:info@spendshift.com.au">
        info@spendshift.com.au
      </Link>

      <Link href="tel:+6109823453455">
        098 2345 3455
      </Link>
    </div>
  </div>

  <div className="container footerBottom">
    <span className="footerCopyright">© SpendShift 2026. All rights reserved.</span>

    <div
      style={{
        display: "flex",
        gap: "16px",
        flexWrap: "wrap",
      }}
    >
      <Link href="/terms-and-conditions">
        Terms & Conditions
      </Link>

      <span>|</span>

      <Link href="/privacy-policy">
        Privacy Policy
      </Link>
    </div>
  </div>
</footer>
    </div>
  );
}

