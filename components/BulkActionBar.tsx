
import React from 'react';
import { MailIcon } from './icons/MailIcon';
import { XIcon } from './icons/XIcon';

// A simple WhatsApp icon component for the button
const WhatsAppIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 32 32" className="w-6 h-6" {...props}>
        <path d=" M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.044-.53-.044-.302 0-.53.09-.68.22-.24.32-.68.78-.68 1.816 0 1.04.857 2.061 1.018 2.213.19.187 1.17 1.96 2.83 2.913.578.32 1.03.52 1.43.66.71.24 1.35.21 1.79.07.57-.18 1.76-.73 2.04-1.39.28-.66.28-1.21.18-1.39-.07-.143-.21-.21-.48-.21z" fill="#FFFFFF"></path>
        <path d=" M20.5 0 L15.21 0 A15.21 15.21 0 0 0 0 15.21 A15.21 15.21 0 0 0 15.21 30.42 A15.21 15.21 0 0 0 30.42 15.21 A15.21 15.21 0 0 0 20.5 0 Z M15.21 27.63 A12.42 12.42 0 0 1 2.79 15.21 A12.42 12.42 0 0 1 15.21 2.79 A12.42 12.42 0 0 1 27.63 15.21 A12.42 12.42 0 0 1 15.21 27.63 Z" fill="url(#grad1)"></path>
        <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#25d366', stopOpacity:1 }} />
                <stop offset="100%" style={{ stopColor: '#128c7e', stopOpacity:1 }} />
            </linearGradient>
        </defs>
    </svg>
);


interface BulkActionBarProps {
    count: number;
    onEmail: () => void;
    onWhatsApp: () => void;
    onClear: () => void;
}

const BulkActionBar: React.FC<BulkActionBarProps> = ({ count, onEmail, onWhatsApp, onClear }) => {
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-brand-blue text-white shadow-lg z-30 transform transition-transform translate-y-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-4">
                        <button onClick={onClear} className="p-2 rounded-full hover:bg-white/20" aria-label="Limpiar selección">
                           <XIcon className="h-6 w-6"/>
                        </button>
                        <span className="font-semibold">{count} {count === 1 ? 'seleccionado' : 'seleccionados'}</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4">
                        <button onClick={onEmail} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 transition text-sm sm:text-base">
                            <MailIcon className="h-5 w-5"/>
                            <span>Email</span>
                        </button>
                        <button onClick={onWhatsApp} className="flex items-center gap-2 pl-2 pr-4 py-1 rounded-full bg-white/20 hover:bg-white/30 transition text-sm sm:text-base">
                            <WhatsAppIcon />
                            <span>WhatsApp</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BulkActionBar;
