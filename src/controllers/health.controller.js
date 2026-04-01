export const healthCheck = async(req,res) => {
    try {
        return res.status(200).json({msg:'health ok'})
    } catch (error) {
        return res.status(500).json({error})
    }
}