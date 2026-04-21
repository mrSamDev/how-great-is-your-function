export function getScoreColor(score: number): string {
	if (score >= 80) return "emerald";
	if (score >= 60) return "yellow";
	if (score >= 40) return "orange";
	return "red";
}

export function getScoreLabel(score: number): string {
	if (score >= 90) return "Excellent";
	if (score >= 80) return "Great";
	if (score >= 70) return "Good";
	if (score >= 60) return "Fair";
	if (score >= 40) return "Needs Work";
	return "Poor";
}
