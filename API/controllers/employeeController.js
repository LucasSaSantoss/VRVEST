// app.post('/api/qrcode', async (req,res) => {
//   const { cpf } = req.body;

//   const userCpf = await prisma.employee.findMany({ where: { cpf } });

//   if (!userCpf) {
//       return res.status(200).json({ message: 'cpf inválido', success: false });
//     }else{
//       console.log(employee,cpf)
//        return res.status(200).json({message: 'cpf válido', success: true, employee: employee})
//     }
// });