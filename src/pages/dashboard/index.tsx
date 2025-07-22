import { GetServerSideProps } from 'next'
import { ChangeEvent, FormEvent, useState } from 'react'
import styles from './styles.module.css'
import Head from 'next/head'

import { getSession } from 'next-auth/react'
import { Textarea } from '../../components/textarea'
import { FiShare2 } from 'react-icons/fi'
import { FaTrash } from 'react-icons/fa'

import { db } from '../../services/firebaseConnection'

import { addDoc, collection } from 'firebase/firestore'


interface DashboardProps {
    user: {
        email: string
    }
}


export default function Dashboard({ user }: DashboardProps) {

    const [inputTask, setInputTask] = useState('')
    const [isPublic, setIsPublic] = useState(false)

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

                    <article className={styles.task}>
                        <div className={styles.tagContainer}>
                            <label className={styles.tag}>PUBLICO</label>
                            <button className={styles.shareButton}>
                                <FiShare2
                                    size={20}
                                    color="#3183ff"
                                />
                            </button>
                        </div>

                        <div className={styles.taskContent}>
                            <p>Descrição da tarefa</p>
                            <button className={styles.trashButton}>
                                <FaTrash size={20} color="#ff4d4d" />
                            </button>
                        </div>
                    </article>  
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