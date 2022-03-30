import { Bitmap, Vector3, ShaderMesh, Plane, Domain2, Rectangle3, Mesh, WebIO, IO } from "../../lib";
import { Bufferable } from "../basics/Bufferable";

/**
 * This describes an image in 3D space.
 * Can be regarded as a 3D sprite, build would be very inefficient to be used like that 
 * Mostly used for debugging textures
 */
export class ImageMesh implements Bufferable<ShaderMesh> {
	constructor(
		public image: Bitmap | HTMLImageElement, 
		public plane: Plane,
        public scale: number,
        public centered: boolean,
        public doubleSided: boolean,
		public forcedZ?: number // allows the z buffer of the shader to be overwritten if desired
		) {}

	static new(image: Bitmap | HTMLImageElement, plane=Plane.WorldXY(), scale=1, centered=true, doubleSided=true, forcedZ?: number) {
		return new ImageMesh(image, plane, scale, centered, doubleSided, forcedZ);
	}

	buffer() : ShaderMesh {
        return ShaderMesh.fromImage(this.image, this.plane, this.centered, this.scale, true, this.doubleSided);
	}
}
