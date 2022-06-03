import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useRouter } from 'next/router';
import { FaCalendar, FaUser } from 'react-icons/fa';
import { GetStaticPaths, GetStaticProps } from 'next';

import { useMemo } from 'react';
import { getPrismicClient } from '../../services/prismic';

import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();
  const publicationDate = useMemo(() => {
    return format(new Date(post.first_publication_date), 'dd MMM yyyy', {
      locale: ptBR,
    });
  }, [post]);

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }
  return (
    <>
      <main>
        <div className={styles.banner}>
          <img src={post.data.banner.url} alt={post.data.title} />
        </div>
        <article className={styles.content}>
          <h1>{post.data.title}</h1>
          <div className={styles.postInfos}>
            <time className={styles.publication}>
              <FaCalendar /> {publicationDate}
            </time>
            <span className={styles.author}>
              <FaUser /> {post.data.author}
            </span>
            <span>4 min</span>
          </div>

          {post.data.content.map(content => (
            <div key={`${content.heading}-${new Date().getMilliseconds()}`}>
              <h2>{content.heading}</h2>
              {content.body.map(p => (
                <p key={content.heading}>{p.text}</p>
              ))}
            </div>
          ))}
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient({});
  const posts = await prismic.getByType('posts');

  const paths = posts.results.map(result => {
    return {
      params: {
        slug: `${result.uid}`,
      },
    };
  });

  return {
    paths: [...paths],
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient({});
  const response = await prismic.getByUID('posts', String(slug), {});

  const content = response.data.content.map(value => {
    return {
      heading: value.heading,
      body: value.body,
    };
  });

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content,
    },
  };

  return {
    props: {
      post,
    },
  };
};
