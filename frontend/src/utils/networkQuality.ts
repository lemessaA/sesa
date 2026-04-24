/**
 * Network Quality Monitor - Tracks connection quality and adapts video quality
 */

export interface NetworkStats {
    rtt: number; // Round trip time in ms
    packetLoss: number; // Percentage
    jitter: number; // ms
    bandwidth: number; // kbps
}

export type NetworkQuality = 'excellent' | 'good' | 'fair' | 'poor';

export class NetworkQualityMonitor {
    private stats: NetworkStats = {
        rtt: 0,
        packetLoss: 0,
        jitter: 0,
        bandwidth: 0
    };

    private quality: NetworkQuality = 'good';
    private listeners: Array<(quality: NetworkQuality, stats: NetworkStats) => void> = [];

    constructor(private peerConnection: RTCPeerConnection) {
        this.startMonitoring();
    }

    private async startMonitoring() {
        setInterval(async () => {
            await this.updateStats();
            this.calculateQuality();
            this.notifyListeners();
        }, 2000); // Check every 2 seconds
    }

    private async updateStats() {
        try {
            const stats = await this.peerConnection.getStats();
            
            stats.forEach(report => {
                if (report.type === 'inbound-rtp' && report.kind === 'video') {
                    this.stats.packetLoss = report.packetsLost / (report.packetsReceived + report.packetsLost) * 100;
                    this.stats.jitter = report.jitter * 1000; // Convert to ms
                }
                
                if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                    this.stats.rtt = report.currentRoundTripTime * 1000; // Convert to ms
                }
            });
        } catch (err) {
            console.error('Failed to get stats:', err);
        }
    }

    private calculateQuality() {
        const { rtt, packetLoss } = this.stats;

        if (rtt < 100 && packetLoss < 1) {
            this.quality = 'excellent';
        } else if (rtt < 200 && packetLoss < 3) {
            this.quality = 'good';
        } else if (rtt < 400 && packetLoss < 5) {
            this.quality = 'fair';
        } else {
            this.quality = 'poor';
        }
    }

    private notifyListeners() {
        this.listeners.forEach(listener => {
            listener(this.quality, this.stats);
        });
    }

    public onQualityChange(callback: (quality: NetworkQuality, stats: NetworkStats) => void) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    public getQuality(): NetworkQuality {
        return this.quality;
    }

    public getStats(): NetworkStats {
        return { ...this.stats };
    }

    public getRecommendedConstraints(): MediaTrackConstraints {
        switch (this.quality) {
            case 'excellent':
                return {
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    frameRate: { ideal: 30 }
                };
            case 'good':
                return {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 }
                };
            case 'fair':
                return {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    frameRate: { ideal: 24 }
                };
            case 'poor':
                return {
                    width: { ideal: 320 },
                    height: { ideal: 240 },
                    frameRate: { ideal: 15 }
                };
        }
    }
}

export const getQualityColor = (quality: NetworkQuality): string => {
    switch (quality) {
        case 'excellent': return 'text-green-500';
        case 'good': return 'text-blue-500';
        case 'fair': return 'text-yellow-500';
        case 'poor': return 'text-red-500';
    }
};

export const getQualityLabel = (quality: NetworkQuality): string => {
    switch (quality) {
        case 'excellent': return 'Excellent';
        case 'good': return 'Good';
        case 'fair': return 'Fair';
        case 'poor': return 'Poor';
    }
};
