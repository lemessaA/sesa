import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from '@/lib/navigation';
import { ArrowLeft, Award, Download } from 'lucide-react';
import apiService from '../../utils/api';

interface CertificateRecord {
    _id: string;
    certificateNumber: string;
    issuedDate: string;
    certificateUrl?: string;
    course?: {
        title?: string;
    };
}

const Certificates: React.FC = () => {
    const navigate = useNavigate();
    const [certificates, setCertificates] = React.useState<CertificateRecord[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                const response = await apiService.certificates.getMyCertificates();
                if (mounted) {
                    setCertificates(Array.isArray(response.data) ? response.data : []);
                }
            } catch (error) {
                if (mounted) {
                    setCertificates([]);
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        load();
        return () => {
            mounted = false;
        };
    }, []);

    return (
        <div className="p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors mb-6"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to Dashboard
                    </button>

                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                            <Award className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-dark-bg dark:text-white">My Certificates</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">View and download your earned certificates</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-gray-800 p-12 text-center">
                            <p className="text-gray-500 dark:text-gray-400">Loading certificates...</p>
                        </div>
                    ) : certificates.length === 0 ? (
                        <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-gray-800 p-12 text-center">
                            <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Award className="w-10 h-10 text-amber-600" />
                            </div>
                            <h3 className="text-xl font-bold text-dark-bg dark:text-white mb-2">No Certificates Yet</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">
                                Complete courses to earn certificates and showcase your achievements
                            </p>
                            <button
                                onClick={() => navigate('/student/browse')}
                                className="px-6 py-3 bg-gradient-to-r from-primary to-accent text-white rounded-xl font-bold hover:shadow-lg transition-all"
                            >
                                Browse Courses
                            </button>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {certificates.map((certificate) => (
                                <div
                                    key={certificate._id}
                                    className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-gray-800 p-5 flex items-center justify-between"
                                >
                                    <div>
                                        <h3 className="text-lg font-bold text-dark-bg dark:text-white">
                                            {certificate.course?.title || 'Completed Course'}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Certificate #{certificate.certificateNumber}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-500">
                                            Issued {new Date(certificate.issuedDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                    {certificate.certificateUrl ? (
                                        <a
                                            href={certificate.certificateUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white hover:opacity-90 transition-opacity"
                                        >
                                            <Download className="w-4 h-4" />
                                            Download
                                        </a>
                                    ) : (
                                        <span className="text-xs text-gray-500">Available for verification</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default Certificates;
