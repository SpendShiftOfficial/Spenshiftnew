import Link from "next/link";
import Image from "next/image";
import { ShieldCheck } from "lucide-react";

export default function Header({ simple = false }: { simple?: boolean }) {
  return (
    <header className="topbar">
      <div
        className="container"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
        }}
      >
        <Link href="/" className="logo">
          <Image
            src="/logo.png"
            alt="SpendShift"
            width={180}
            height={50}
            priority
          />
        </Link>

        {simple ? (
          <span
            className="mini"
            style={{
              display: "flex",
              gap: 6,
              alignItems: "center",
            }}
          >
            <ShieldCheck size={16} color="#059625" />
            100% Secure & Private
          </span>
        ) : (
          <>
            <nav className="nav">
              <a href="#audit">How it Works</a>
              <a href="#works">What You Get</a>
              <a href="#why">Why SpendShift</a>
              <a href="#pricing">Pricing</a>
              <a href="#faq">FAQ</a>
            </nav>

            <Link className="btn" href="/audit">
              Start Your Free Audit
            </Link>
          </>
        )}
      </div>
    </header>
  );
}