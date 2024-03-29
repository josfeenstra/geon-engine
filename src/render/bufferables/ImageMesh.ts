import { Bitmap, Vector3, ShaderMesh, Plane, Domain2, Rectangle3, Mesh, WebIO, IO } from "../../lib";
import { Bufferable } from "../basics/Bufferable";

/**
 * This describes an image in 3D space.
 * Can be regarded as a 3D sprite, build would be very inefficient to be used like that 
 * Mostly used for debugging textures
 */
export class ImageMesh implements Bufferable<ShaderMesh> {
	constructor(
		public image: Bitmap, 
		public plane: Plane,
        public scale: number,
        public centered: boolean,
        public doubleSided: boolean) {}

	static new(image: Bitmap, plane=Plane.WorldXY(), scale=1, centered=true, doubleSided=true) {
		return new ImageMesh(image, plane, scale, centered, doubleSided);
	}

	buffer() : ShaderMesh {
        return ShaderMesh.fromImage(this.image, this.plane, this.centered, this.scale, this.doubleSided);
	}
}
