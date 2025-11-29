import Navbar from './Navbar';
import Footer from './Footer';
import Breadcrumbs from './Breadcrumbs';

const Layout = ({ children, user }) => {
    return (
        <div className="min-h-screen flex flex-col bg-subsurface">
            {user && <Navbar user={user} />}

            <main className="flex-1 container mx-auto px-6 py-8 max-w-screen-xl overflow-x-hidden w-full">
                <Breadcrumbs />
                {children}
            </main>

            <Footer />
        </div>
    );
};

export default Layout;
