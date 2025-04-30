import Link from "next/link";

export default function Header() {
    return (
        <header className="header">
            <div className="nav-left">
                <Link href="/">Home</Link>
            </div>
            <h1>AI Post Enhancer 🚀</h1>
            <div className="nav-right">
                <Link href="/support">Support</Link>
            </div>
        </header>
    );
}
