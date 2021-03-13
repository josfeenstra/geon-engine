// purpose: simple operations with only numbers
 



export class GMath {
    
    // make sure 'value' is more than 'lower', and less than 'upper'
    static clamp(value: number, lower: number, upper: number) {
        return Math.min(Math.max(value, lower), upper);
    }

    static fade(t: number) : number
	{
		// Fade function as defined by Ken Perlin.  This eases coordinate values
		// so that they will ease towards integral values.  This ends up smoothing
		// the final output.
		return t * t * t * (t * (t * 6 - 15) + 10);         // 6t^5 - 15t^4 + 10t^3
	}

	static lerp(a: number, b: number, x: number) : number
	{
		return a + x * (b - a);
	}


}