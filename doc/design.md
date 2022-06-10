# some rules
- orwellian principles (if you can leave it out, leave it out)
- when converting, eq. 'Circle to Mesh', use the 'fromCircle()' in mesh. If you want a 'toMesh()', cross-refer to fromCircle in mesh. 
- create a 'static new()' method to replace constructor, a la rust. this way, constructor overloading (in mesh, matrix) is clear, and 'new' does not have to be used
- use ```calculate``` to signify something happening to the entire structure of the object


# rendering
- I recently renamed `Renderer` to `Shader`, since they essentially are shader wrappers
- A renderer means the entire process of feeding something to a `shader`. Once the `shader` name is established, I will rename things like `Combo` to `Renderer`.


- All Renderers should not ask for anything interesting in the constructors: they should be factory-able.
- All renderers must have different 'setState' functions, to be called separately from 'render' function.



# shortcomings
- figure out how to do a proper library build, with one lib.js and one lib.d.ts


