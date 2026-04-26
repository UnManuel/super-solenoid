// by UnManuel.com

export default class Tween
{
    static interpolatePoint(points, t)
    {
        if(points.length === 1)
            return points[0];

        const interpolatedPoints = [];

        for(let i = 0; i < points.length - 1; ++i)
        {
            const p0 = points[i];
            const x0 = p0.x;
            const y0 = p0.y;
            const z0 = p0.z;

            const p1 = points[i + 1];
            const x1 = p1.x;
            const y1 = p1.y;
            const z1 = p1.z;

            const interpolatedPoint = {};
            interpolatedPoint.x = x0 + (x1 - x0) * t;
            interpolatedPoint.y = y0 + (y1 - y0) * t;
            interpolatedPoint.z = z0 + (z1 - z0) * t;

            interpolatedPoints.push(interpolatedPoint);
        }

        return this.interpolatePoint(interpolatedPoints, t);
    }

    static linear(t)
    {
        return t;
    }

    static easeInQuad(t)
    {
        return t * t;
    }

    static easeInCubic(t)
    {
        return t * t * t;
    }

    static easeInQuint(t)
    {
        return t * t * t * t * t;
    }

    static easeOutQuad(t)
    {
        return t * (2 - t);
    }

    static easeOutCubic(t)
    {
        t = t - 1;
        return t * t * t + 1;
    }

    static easeOutQuint(t)
    {
        t = t - 1;
        return t * t * t * t * t + 1;
    }

    static easeInOutQuad(t)
    {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    static easeInOutCubic(t)
    {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    }

    static easeInOutQuint(t)
    {
        if(t < 0.5)
            return 16 * t * t * t * t * t;
        
        t = t - 1;
        return 1 + 16 * t * t * t * t * t;
    }

    static easeOutInQuad(t)
    {
        return t < 0.5 ? 0.5 * (1 - Tween.easeInQuad(1 - 2 * t)) : 0.5 * Tween.easeInQuad(t * 2 - 1) + 0.5;
    }

    static easeOutInCubic(t)
    {
        return t < 0.5 ? 0.5 * (1 - Tween.easeInCubic(1 - 2 * t)) : 0.5 * Tween.easeInCubic(t * 2 - 1) + 0.5;
    }

    static easeOutInQuint(t)
    {
        return t < 0.5 ? 0.5 * (1 - Tween.easeInQuint(1 - 2 * t)) : 0.5 * Tween.easeInQuint(t * 2 - 1) + 0.5;
    }
}
