import Link from "next/link";
import DeviceImage from "next/image";
import Header from "@/components/Header";
import Quote from "next/image";
import Author from "next/image";
import FooterlogoImage from "next/image";
import {
  ShieldCheck,
  EyeOff,
  LockKeyhole,
  Sparkles,
  WalletCards,
  ClipboardCheck,
  ChartNoAxesCombined,
  Search,
  Clock,
  FileText,
  Users,
  Menu,
  Zap,
  BarChart3,
  Smartphone,
  PieChart,
  CreditCard,
  CheckCircle2,
  MoveRight,
  MessageSquareLock,
} from "lucide-react";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaYoutube,
  FaXTwitter,
} from "react-icons/fa6";
export default function Home() {
  return (
    <>
      <Header />
      <main>
        <section className="heroShell" id="audit">
          <div className="container hero">
            <div className="heroCopy">
              <span className="badge">
                <CheckCircle2
                  className="text-[#059625]"
                  fill="currentColor"
                  stroke="white"
                  size={20}
                />
                100% Data-driven, 100% about you
              </span>
              <h1>
                Find your biggest money leaks in under <span>2 minutes.</span>
              </h1>
              <p>
                We analyse your spending using real data to uncover hidden money
                leaks and show you exactly how to fix them fast.
              </p>
              <div className="checks">
                <span>
                  <CheckCircle2
                    className="text-[#059625]"
                    fill="currentColor"
                    stroke="white"
                    size={20}
                  />{" "}
                  Takes 2 minutes
                </span>
                <span>
                  <CheckCircle2
                    className="text-[#059625]"
                    fill="currentColor"
                    stroke="white"
                    size={20}
                  />{" "}
                  No signup required
                </span>
                <span>
                  <CheckCircle2
                    className="text-[#059625]"
                    fill="currentColor"
                    stroke="white"
                    size={20}
                  />{" "}
                  100% Secure
                </span>
              </div>
              <Link className="btn" href="/audit">
                Start Your Free Audit
                <MoveRight size={18} strokeWidth={2.5} />
              </Link>
              <div className="spacer50"></div>
              <div className="hero-bottom-text reveal">
                <p className="margin-zero">
                  Free results in under 2 minutes. No credit card required.
                </p>
                <p className="margin-zero">
                  <span>Join 10,000+ Australians saving smarter</span>
                </p>
              </div>
            </div>

            <div
              className="heroVisual"
              aria-label="SpendShift mobile results preview"
            >
              <div className="floatCard leftCard">
                <ShieldCheck size={34} />
                <b>Your data is private & secure</b>
                <p>Bank-level security. We never share your information.</p>
              </div>
              <div className="phoneFrame1">
                <DeviceImage
                  src="/home/Device.svg"
                  alt="Device"
                  width={408}
                  height={800}
                  priority
                  
                />
              </div>
              {/* <div className="phoneFrame">
                <div className="phoneNotch" />
                <div className="phoneScreen">
                  <div className="mobileHeader">
                    <span className="mobileLogo">↗ SpendShift</span>
                    <Menu size={24} />
                  </div>
                  <h3>
                    We found your <span>likely money leaks.</span>
                  </h3>
                  <div className="mobileSavings">
                    $2,300 - $4,800 <small>/year</small>
                  </div>
                  <h4>Your Top 3 money leaks</h4>
                  {[1, 2, 3].map((item) => (
                    <div className="mobileLeak" key={item}>
                      <div className="leakIcon">
                        <PieChart size={18} />
                      </div>
                      <div>
                        <b>Takeaway & Food Delivery</b>
                        <span>Estimated savings</span>
                        <strong>
                          $900-$1,800<small>/year</small>
                        </strong>
                      </div>
                      <small className="impact">
                        High
                        <br />
                        impact
                      </small>
                    </div>
                  ))}
                  <Link className="btn mobileBtn" href="/audit">
                    Start Your Free Audit
                  </Link>
                </div>
              </div> */}
              <div className="floatCard rightCard">
                <ChartNoAxesCombined size={38} />
                <b>Real insights. Real savings.</b>
                <p>Built on real data, not guesswork.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="stats-section">
          <div className="container">
            <div className="stats">
              <div className="stat">
                <div><Users size={50} /></div>
               <div> <strong>10,000+</strong>
                <span>Australians already <br></br>saving smarter</span></div>
              </div>
              <div className="stat">
               <div><WalletCards size={50} /></div> 
               <div> <strong>$2,800</strong>
                <span>Average savings <br></br>found</span></div>
              </div>
              <div className="stat">
                <div><Clock size={50} /></div>
              <div>  <strong>100%</strong>
                <span>Private & Secure<br></br>
by design</span></div>
              </div>
              <div className="stat">
               <div> <ShieldCheck size={50} /></div>
                <div><strong>Australia</strong>
                <span>Built for Australians.<br></br> Local. Relevant.</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className="container" id="why">
          <h2 className="sectionTitle">
            Everything you need to save
            <br />
            <span>more, stress less.</span>
          </h2>
          <div className="cards">
            <div className="card">
              <div className="icon">
                <Search size={37} strokeWidth={1} />
              </div>
              <h3>Find Hidden Overpayments</h3>
              <p>We scan your spending patterns to find the money you didn't know you were losing.</p>
            </div>
            <div className="card">
              <div className="icon">
                <Zap size={37} strokeWidth={1} />
              </div>
              <h3>Data-Backed Insights</h3>
              <p>Our platform is built on real data, not opinions or assumptions.</p>
            </div>
            <div className="card">
              <div className="icon">
                <FileText size={37} strokeWidth={1} />
              </div>
              <h3>Personalised Action Plan</h3>
              <p>Get a simple step-by-step plan to fix leaks and keep more of your money.</p>
            </div>
            <div className="card">
              <div className="icon">
                <LockKeyhole size={37} strokeWidth={1} />
              </div>
              <h3>Private. Secure.</h3>
              <p>Your data is encrypted and never shared. 100% privacy guaranteed</p>
            </div>
          </div>
        </section>

        <section className="container stepsSection" id="works">
          <h2 className="sectionTitle">
            Everything you need to save
            <br />
            <span>more, stress less.</span>
          </h2>
          <div className="steps">
            <div>
              <div className="stepNum">01</div>
              <div className="stepIconWrapper">
              <Smartphone className="stepIcon" strokeWidth={1} size={67} /></div>
              <h3>Answer 8 simple questions</h3>
              <p>Takes less than 2 minutes.</p>
            </div>
            <div>
              <div className="stepNum">02</div>
              <div className="stepIconWrapper">
              <Search className="stepIcon" strokeWidth={1} size={67}/></div>
              <h3>We analyse your spending</h3>
              <p>Using real data and smart technology.</p>
            </div>
            <div>
              <div className="stepNum">03</div>
              <div className="stepIconWrapper">
              <PieChart className="stepIcon" strokeWidth={1} size={67}/></div>
              <h3>Get your top money leak</h3>
              <p>See where you’re losing the most.</p>
            </div>
            <div>
              <div className="stepNum">04</div>
              <div className="stepIconWrapper">
              <MessageSquareLock className="stepIcon" strokeWidth={1} size={67}/></div>
              <h3>Unlock your full plan</h3>
              <p>Get your personalised plan instantly.</p>
            </div>
          </div>
        </section>

        <section className="container testimonial">
         <div className="quote">
  <Quote
    src="/home/quote-icon.svg"
    alt="Quote Icon"
    width={36}
    height={26}
    priority
  />

  <p>
    SpendShift showed me I was wasting over $3,000 a year on things I'd
    completely forgotten about. It literally changed the way I manage money.
  </p>

  <div className="author">
    <Author
      src="/home/author-image.svg"
      alt="Sarah"
      width={120}
      height={120}
      className="authorImage"
    />

    <div className="authorInfo">
      <h4>Sarah J.</h4>
      <span>Melbourne, VIC</span>
    </div>
  </div>
</div>
          <div className="cards miniCards">
            <div className="card">
              <b>Average savings found</b>
              <div className="savings">$2,800</div>
              <p>/year</p>
              <p>Australia-wide</p>
            </div>
            <div className="card">
              <b>Total Aussies already saving</b>
              <div className="savings">10,000+</div>
              <p>and counting</p>
            </div>
          </div>
        </section>

        <section id="pricing">
          <div className="container">
            <div className="cta">
              <div>
                <h2>Stop overpaying. Start saving.</h2>
                <p>Your free audit takes less than 2 minutes.</p>
              </div>
              <div>
                <Link className="btn white" href="/audit">
                  Start Your Free Audit →
                </Link>
                <p className="noCard">No credit card required.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

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
  <Link href="https://facebook.com" target="_blank">
    <FaFacebookF size={20} />
  </Link>

  <Link href="https://x.com" target="_blank">
    <FaXTwitter size={20} />
  </Link>

  <Link href="https://youtube.com" target="_blank">
    <FaYoutube size={20} />
  </Link>

  <Link href="https://instagram.com" target="_blank">
    <FaInstagram size={20} />
  </Link>

  <Link href="https://linkedin.com" target="_blank">
    <FaLinkedinIn size={20} />
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

      <Link href="mailto:spendshiftinfo@gmail.com">
        spendshiftinfo@gmail.com
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
    </>
  );
}
