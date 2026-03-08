const EMOTION_EMOJIS = {
    happy: { emoji: '😄', label: 'Happy', color: '#FFD700' },
    sad: { emoji: '😢', label: 'Sad', color: '#6495ED' },
    angry: { emoji: '😠', label: 'Angry', color: '#FF4500' },
    fearful: { emoji: '😨', label: 'Fearful', color: '#9370DB' },
    disgusted: { emoji: '🤢', label: 'Disgusted', color: '#32CD32' },
    surprised: { emoji: '😲', label: 'Surprised', color: '#FF69B4' },
    neutral: { emoji: '😐', label: 'Neutral', color: '#A0A0A0' },
};

export default function InfoPanel({ detection }) {
    if (!detection) {
        return (
            <div className="info-panel empty">
                <div className="no-face-icon">🫥</div>
                <p className="no-face-text">Position your face in the camera</p>
                <p className="no-face-sub">Make sure your face is well-lit and clearly visible</p>
            </div>
        );
    }

    const { shape, emotion, allExpressions } = detection;
    const sortedExpressions = Object.entries(allExpressions)
        .sort((a, b) => b[1] - a[1]);

    return (
        <div className="info-panel">
            {/* Face Shape Card */}
            <div className="info-card shape-card" style={{ '--accent': '#6C63FF' }}>
                <div className="card-header">
                    <span className="card-icon">📐</span>
                    <span className="card-title">Face Shape</span>
                </div>
                <div className="shape-result">
                    <span className="shape-emoji">{shape.emoji}</span>
                    <div className="shape-details">
                        <span className="shape-name">{shape.shape}</span>
                        <span className="shape-desc">{shape.description}</span>
                    </div>
                </div>
            </div>

            {/* Emotion Card */}
            <div className="info-card emotion-card" style={{ '--accent': emotion.color }}>
                <div className="card-header">
                    <span className="card-icon">🎭</span>
                    <span className="card-title">Current Emotion</span>
                </div>
                <div className="emotion-result">
                    <span className="emotion-emoji">{emotion.emoji}</span>
                    <div className="emotion-details">
                        <span className="emotion-name">{emotion.label}</span>
                        <div className="confidence-bar-wrapper">
                            <div
                                className="confidence-bar"
                                style={{ width: `${(emotion.confidence * 100).toFixed(1)}%`, background: emotion.color }}
                            />
                        </div>
                        <span className="confidence-pct">{(emotion.confidence * 100).toFixed(1)}% confidence</span>
                    </div>
                </div>
            </div>

            {/* All Emotions Breakdown */}
            <div className="info-card expressions-card">
                <div className="card-header">
                    <span className="card-icon">📊</span>
                    <span className="card-title">Emotion Breakdown</span>
                </div>
                <div className="expressions-list">
                    {sortedExpressions.map(([key, val]) => {
                        const info = EMOTION_EMOJIS[key] || { emoji: '❓', label: key, color: '#aaa' };
                        const pct = (val * 100).toFixed(1);
                        return (
                            <div key={key} className="expression-row">
                                <span className="exp-emoji">{info.emoji}</span>
                                <span className="exp-label">{info.label}</span>
                                <div className="exp-bar-bg">
                                    <div
                                        className="exp-bar-fill"
                                        style={{ width: `${pct}%`, background: info.color }}
                                    />
                                </div>
                                <span className="exp-pct">{pct}%</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
