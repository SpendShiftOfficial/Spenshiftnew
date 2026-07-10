import Link from "next/link";
import Image from "next/image";

import {
  ShieldCheck,
  WalletCards,
  ChartNoAxesCombined,
  Search,
  Clock,
  FileText,
  Sparkles,
  Smartphone,
  PieChart,
  CheckCircle2,
  MoveRight,
  MessageSquareLock,
  ClipboardCheck,
  MapPin,
  EyeOff,
  CircleDollarSign,
  ListChecks,
  CalendarDays,
  Save,
  Bot,
  Target,
  Route,
} from "lucide-react";

import { FaFacebook, FaInstagram } from "react-icons/fa6";
import { FaTiktok } from "react-icons/fa";

export default function Footer({ simple = false }: { simple?: boolean }) {
  // Agar simple true ho, toh sirf footer bottom dikhane ke liye aap ye condition use kar sakte hain
  if (simple) {
    return (
      <footer className="footer">
        <div className="container footerBottom">
          <span className="footerCopyright">
            © SpendShift 2026. All rights reserved.
          </span>
          <div className="footerLegalLinks">
            <Link href="/terms-and-conditions">Terms &amp; Conditions</Link>
            <span>|</span>
            <Link href="/privacy-policy">Privacy Policy</Link>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="footer">
      <div className="container footerGrid">
        <div className="footerBrand">
          <div className="footerLogo">
            <Link href="/" className="logo">
              <Image
                src="/logo.png"
                alt="SpendShift"
                width={180}
                height={50}
              />
            </Link>
          </div>

          <p>
            SpendShift helps Australians uncover hidden money leaks, reduce
            unnecessary spending and take practical action with personalised
            AI-powered savings insights.
          </p>

          <div className="socials">
            <Link
              href="https://facebook.com/spendshiftofficial"
              target="_blank"
              aria-label="SpendShift on Facebook"
            >
              <FaFacebook size={20} />
            </Link>

            <Link
              href="https://instagram.com/spendshiftofficial"
              target="_blank"
              aria-label="SpendShift on Instagram"
            >
              <FaInstagram size={20} />
            </Link>

            <Link
              href="https://www.tiktok.com/@spendshiftofficial"
              target="_blank"
              aria-label="SpendShift on TikTok"
            >
              <FaTiktok size={20} />
            </Link>
          </div>
        </div>

        <div>
          <h4>Learn</h4>
          <Link href="/how-it-works">How It Works</Link>
          <Link href="/whats-included">What’s Included</Link>
          <Link href="/why-spendshift">Why SpendShift</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/#faq">Frequently Asked Questions</Link>
        </div>

        <div>
          <h4>Services</h4>
          <Link href="/#services">Free Savings Audit</Link>
          <Link href="/#services">Personalised Savings Report</Link>
          <Link href="/#services">30-Day Savings Action Plan</Link>
        </div>

        <div>
          <h4>Legal</h4>
          <Link href="/privacy-policy">Privacy Policy</Link>
          <Link href="/terms-and-conditions">Terms &amp; Conditions</Link>
          <Link href="/cookies">Cookie Policy</Link>
        </div>

        <div>
          <h4>Contact</h4>
          <Link href="mailto:info@spendshift.com.au">
            info@spendshift.com.au
          </Link>
          <Link href="tel:+6109823453455">098 2345 3455</Link>
        </div>
      </div>

      <div className="container footerBottom">
        <span className="footerCopyright">
          © SpendShift 2026. All rights reserved.
        </span>

        <div className="footerLegalLinks">
          <Link href="/terms-and-conditions">Terms &amp; Conditions</Link>
          <span>|</span>
          <Link href="/privacy-policy">Privacy Policy</Link>
        </div>
      </div>
    </footer>
  );
}