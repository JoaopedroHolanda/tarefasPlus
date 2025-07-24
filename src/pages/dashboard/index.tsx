import { GetServerSideProps } from 'next'
import { ChangeEvent, FormEvent, useState, useEffect } from 'react'
import styles from './styles.module.css'
import Head from 'next/head'

import { getSession } from 'next-auth/react'
import { Textarea } from '../../components/textarea'
import { FiShare2 } from 'react-icons/fi'
import { FaTrash } from 'react-icons/fa'

import { db } from '../../services/firebaseConnection'

import { addDoc, collection, query, orderBy, where, onSnapshot, doc, deleteDoc } from 'firebase/firestore'
import Link from 'next/link'


interface DashboardProps {
    user: {
        email: string
    }
}

interface taskProps {
    id: string;
    created: Date;
    public: boolean;
    task: string;
    user: string;
}


export default function Dashboard({ user }: DashboardProps) {

    const [inputTask, setInputTask] = useState('')
    const [isPublic, setIsPublic] = useState(false)
    const [tasks, setTasks] = useState<taskProps[]>([])

    useEffect(()=> {
        async function loadTasks() {
            const tasksRef = collection(db, 'task')
            const q = query(
                tasksRef,
                orderBy('created', 'desc'),
                where('user', '==', user?.email)
            )

            onSnapshot(q, (snapshot)=>{
                let lista = [] as taskProps[];

                snapshot.forEach((doc) => {
                    lista.push({
                        id: doc.id,
                        created: doc.data().created,
                        public: doc.data().public,
                        task: doc.data().task,
                        user: doc.data().user
                    })
                })
                setTasks(lista);
            })
        }
        loadTasks();
    }, [user?.email])

    function handleChangePublic(event: ChangeEvent<HTMLInputElement>) {
        setIsPublic(event.target.checked)
    }

    async function handleRegisterTask(event: FormEvent) {
        event.preventDefault();

        if(inputTask === ''){
            return;
        }

        try{
            await addDoc(collection(db, 'task'), {
                task: inputTask,
                created: new Date(),
                user: user?.email,
                public: isPublic
            })

            setInputTask('');
            setIsPublic(false);
            
        }catch(error) {
            console.log(error);
        }
    }

    async function handleShare(id: string) {
        await navigator.clipboard.writeText(
            `${process.env.NEXT_PUBLIC_URL}/task/${id}`
        )

        alert('Link copiado com sucesso!')
    }

    async function handleDeleteTask(id: string){
        const docRef = doc(db, 'task', id);
        await deleteDoc(docRef)
        alert('Tarefa deletada com sucesso!')
    }

    return(
        <div className={styles.container}>
            <Head>
                <title>Tarefas+: Painel de Tarefas</title>
            </Head>

            <main className={styles.main}>
                <section className={styles.content}>
                    <div className={styles.contentForm}>
                        <h1 className={styles.title}>Qual a sua tarefa?</h1>
                            <form onSubmit={handleRegisterTask}>
                                <Textarea
                                    placeholder='Digite qual a sua tarefa'
                                    value={inputTask}
                                    onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setInputTask(e.target.value)}
                                />
                                <div className={styles.checkboxArea}>
                                    <input 
                                        type="checkbox" className={styles.checkbox} 
                                        checked={isPublic}
                                        onChange={handleChangePublic}
                                    />
                                    <label htmlFor="important">Deixar tarefa pública?</label>
                                </div>
                                <button type="submit" className={styles.button}>Registrar</button>
                            </form>
                    </div>
                </section>

                <section className={styles.taskContainer}>
                    <h1>Minhas tarefas</h1>

                    {tasks.map((task)=> (
                        <article key={task.id} className={styles.task}>
                        {task.public && (
                            <div className={styles.tagContainer}>
                            <label className={styles.tag}>PUBLICO</label>
                            <button className={styles.shareButton} onClick={() => handleShare(task.id)}>
                                <FiShare2
                                    size={20}
                                    color="#3183ff"
                                />
                            </button>
                        </div>
                        )}

                        <div className={styles.taskContent}>
                            {task.public ? (
                                <Link href={`/task/${task.id}`}>
                                    <p>{task.task}</p>  
                                </Link>
                            ) : (
                                <p>{task.task}</p>
                            )}
                            <button className={styles.trashButton} onClick={() => handleDeleteTask(task.id)}>
                                <FaTrash size={20} color="#ff4d4d" />
                            </button>
                        </div>
                    </article>  
                    ))}
                </section>
            </main>
        </div>
    )
}

export const getServerSideProps: GetServerSideProps = async({ req }) =>{
    const session = await getSession({ req })

    if(!session?.user){
        return{
            redirect: {
                destination: '/',
                permanent: false,
            }
        }
    }

    return {
        props: {
            user: {
                email: session?.user?.email
            }
        },
    }
}